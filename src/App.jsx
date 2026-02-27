import { useState } from 'react'

const SPAM_WORDS = {
  high: [
    'act now','buy now','buy direct','click here','click below','congratulations','dear friend','dear member',
    '100% free','you\'re a winner','you have been selected','this isn\'t spam','not spam','we hate spam',
    'no obligation','winner','lottery','casino','weight loss','work from home','make money','earn extra cash',
    'double your','million dollars','risk free','no risk','as seen on','click to remove','apply now','order now',
    'supplies limited','no experience needed','be your own boss','financial freedom','get rich','get paid',
    'multi-level marketing','mlm','nigerian','offshore','pharmacy','pills','viagra','cialis','enlargement',
    'wire transfer','western union','bitcoin opportunity','crypto profit','guaranteed income','passive income scheme'
  ],
  medium: [
    'free','guarantee','no cost','no fees','limited time','offer expires','act immediately','urgent',
    'call now','do it today','don\'t hesitate','once in a lifetime','special promotion','while supplies last',
    'what are you waiting for','incredible deal','amazing','unbelievable','fantastic offer','lowest price',
    'best price','satisfaction guaranteed','money back','no questions asked','no strings attached',
    'no purchase necessary','bonus','prize','gift card','free trial','free access','free consultation',
    'free quote','instant','eliminate','stop','congratulate','selected','chosen','exclusive deal',
    'credit card','compare rates','refinance','consolidate','pre-approved','acceptance','affordable',
    'bargain','beneficiary','billing','cash bonus','certified','cheap','claim','clearance','collect',
    'debt','direct email','direct marketing','f r e e','fast cash','for free','give away','giving away',
    'hidden','incredible','info you requested','information you requested','initial','investment',
    'join millions','lower rates','luxury','mail order','miracle','money making','month','name brand',
    'no catch','no disappointment','no gimmick','no hidden costs','obligation','one hundred percent',
    'pennies a day','potential earnings','promise you','pure profit','removes','reversal','risk-free',
    'sale','sample','satisfaction','score','see for yourself','serious','special','subject to','subscribe',
    'trial','undisclosed','unlimited','unsolicited','warranty','winning','you are a winner',
    'you\'ve been chosen','zero risk','100%','50% off'
  ],
  low: [
    'reminder','help','percent off','% off','sale','save','deal','offer','clearance','discount',
    'compare','opportunity','solution','introducing','announcing','new','improved','revolutionary',
    'breaking','alert','attention','important','notification','update','confirm','verify','validate',
    'account','password','security','suspended','locked','expire','renew','billing','invoice',
    'payment','receipt','shipping','delivery','tracking','order','purchase'
  ]
}

function analyzeContent(text, isHtml, subjectLine) {
  if (!text.trim() && !subjectLine.trim()) return null
  const combined = (subjectLine + ' ' + text).toLowerCase()
  const plainText = isHtml ? text.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ') : text
  const plainLower = plainText.toLowerCase()
  const words = plainText.trim().split(/\s+/).filter(Boolean)

  // 1. Spam trigger detection
  const foundSpam = { high: [], medium: [], low: [] }
  for (const [severity, triggers] of Object.entries(SPAM_WORDS)) {
    for (const trigger of triggers) {
      if (combined.includes(trigger) && !foundSpam[severity].includes(trigger)) {
        foundSpam[severity].push(trigger)
      }
    }
  }
  const spamPenalty = foundSpam.high.length * 8 + foundSpam.medium.length * 3 + foundSpam.low.length * 1
  const spamScore = Math.max(0, Math.min(100, 100 - spamPenalty))

  // 2. Link analysis
  const urlRegex = /https?:\/\/[^\s<"']+/gi
  const links = text.match(urlRegex) || []
  const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'tiny.cc', 'shorte.st']
  const shortLinks = links.filter(l => shorteners.some(s => l.toLowerCase().includes(s)))
  const hasUnsubscribe = combined.includes('unsubscribe') || combined.includes('opt out') || combined.includes('opt-out')
  const linkIssues = []
  if (shortLinks.length > 0) linkIssues.push({ severity: 'high', text: `${shortLinks.length} URL shortener(s) detected — spam filters flag these` })
  if (links.length > 8) linkIssues.push({ severity: 'medium', text: `${links.length} links found — more than 5–8 can trigger spam filters` })
  if (links.length > 0 && !hasUnsubscribe) linkIssues.push({ severity: 'medium', text: 'No unsubscribe link detected — required by CAN-SPAM' })
  if (links.length === 0 && words.length > 20) linkIssues.push({ severity: 'low', text: 'No links found — marketing emails typically include at least one' })
  const linkScore = Math.max(0, 100 - shortLinks.length * 20 - (links.length > 8 ? 15 : 0) - (!hasUnsubscribe && links.length > 0 ? 15 : 0))

  // 3. Image-to-text ratio (HTML only)
  let imageScore = 100
  const imageIssues = []
  if (isHtml) {
    const imgTags = text.match(/<img[^>]*>/gi) || []
    const imgsWithoutAlt = imgTags.filter(tag => !tag.includes('alt=') || /alt=["']\s*["']/i.test(tag))
    const textLength = plainText.trim().length
    const imageCount = imgTags.length
    if (imageCount > 0 && textLength < 100) {
      imageIssues.push({ severity: 'high', text: 'Image-heavy email with very little text — major spam trigger' })
      imageScore -= 40
    }
    if (imageCount > 0 && textLength > 0 && textLength < imageCount * 50) {
      imageIssues.push({ severity: 'medium', text: 'Low text-to-image ratio — aim for 60% text, 40% images' })
      imageScore -= 20
    }
    if (imgsWithoutAlt.length > 0) {
      imageIssues.push({ severity: 'medium', text: `${imgsWithoutAlt.length} image(s) missing alt text — hurts accessibility and deliverability` })
      imageScore -= 10 * imgsWithoutAlt.length
    }
    if (imageCount === 0 && textLength > 200) {
      imageIssues.push({ severity: 'low', text: 'No images found — images can improve engagement (but keep ratio balanced)' })
      imageScore -= 5
    }
    imageScore = Math.max(0, Math.min(100, imageScore))
  }

  // 4. Formatting
  const allCapsLines = plainText.split('\n').filter(line => {
    const trimmed = line.trim()
    return trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
  })
  const excessivePunctuation = (text.match(/[!]{2,}/g) || []).length + (text.match(/[?]{2,}/g) || []).length
  const formatIssues = []
  if (allCapsLines.length > 0) formatIssues.push({ severity: 'high', text: `${allCapsLines.length} line(s) in ALL CAPS — this is a major spam signal` })
  if (excessivePunctuation > 0) formatIssues.push({ severity: 'medium', text: `${excessivePunctuation} instance(s) of excessive punctuation (!! or ??)` })
  if (isHtml) {
    const colorRed = /color\s*:\s*(red|#ff0000|#f00|rgb\s*\(\s*255\s*,\s*0\s*,\s*0\s*\))/gi
    if (colorRed.test(text)) formatIssues.push({ severity: 'medium', text: 'Red-colored text detected — this is a common spam signal' })
    const largeFonts = text.match(/font-size\s*:\s*(\d+)/gi) || []
    const bigFonts = largeFonts.filter(f => parseInt(f.match(/\d+/)[0]) > 22)
    if (bigFonts.length > 0) formatIssues.push({ severity: 'low', text: 'Very large font sizes detected (>22px) — can trigger filters' })
  }
  if (words.length < 20 && words.length > 0) formatIssues.push({ severity: 'low', text: `Only ${words.length} words — very short emails can appear suspicious` })
  if (words.length > 500) formatIssues.push({ severity: 'low', text: `${words.length} words — very long emails have lower engagement` })
  const formatScore = Math.max(0, 100 - allCapsLines.length * 15 - excessivePunctuation * 10 - formatIssues.filter(i => i.severity === 'medium').length * 8 - formatIssues.filter(i => i.severity === 'low').length * 3)

  // 5. Compliance
  const complianceChecks = [
    { label: 'Physical mailing address', pass: /\b\d+\s+[\w\s]+(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|ct|court|way|pl|place)\b/i.test(plainText) || /\bP\.?O\.?\s*Box\b/i.test(plainText) || /\b\d{5}(-\d{4})?\b/.test(plainText) },
    { label: 'Unsubscribe option', pass: hasUnsubscribe },
    { label: 'Sender identification', pass: /\b(from|sent by|on behalf of)\b/i.test(plainText) || subjectLine.trim().length > 0 },
    { label: 'Non-deceptive subject line', pass: subjectLine.trim().length === 0 || !/^(re:|fw:|fwd:)\s/i.test(subjectLine.trim()) || combined.includes('reply') },
    { label: 'Content matches subject', pass: true },
  ]
  const passedChecks = complianceChecks.filter(c => c.pass).length
  const complianceScore = Math.round((passedChecks / complianceChecks.length) * 100)

  // Overall
  const overall = Math.round(
    spamScore * 0.35 +
    linkScore * 0.20 +
    (isHtml ? imageScore * 0.15 : (linkScore * 0.075 + spamScore * 0.075)) +
    formatScore * 0.15 +
    complianceScore * 0.15
  )

  return {
    overall,
    wordCount: words.length,
    categories: {
      spam: { score: spamScore, found: foundSpam },
      links: { score: linkScore, issues: linkIssues, count: links.length, shortLinks },
      images: { score: imageScore, issues: imageIssues, isHtml },
      format: { score: formatScore, issues: formatIssues, allCapsLines },
      compliance: { score: complianceScore, checks: complianceChecks },
    }
  }
}

function getScoreColor(score) {
  if (score >= 80) return 'text-turtle'
  if (score >= 60) return 'text-azure'
  if (score >= 40) return 'text-tangerine'
  return 'text-coral'
}

function getVerdict(score) {
  if (score >= 80) return 'Inbox Ready'
  if (score >= 60) return 'Mostly Safe'
  if (score >= 40) return 'At Risk'
  return 'High Spam Risk'
}

function ScoreCircle({ score }) {
  const radius = 54
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const dim = (radius + stroke) * 2
  const colorHex = score >= 80 ? '#00CAAA' : score >= 60 ? '#0073EC' : score >= 40 ? '#F59D00' : '#FF4A48'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} stroke="rgba(67,79,88,0.3)" strokeWidth={stroke} fill="none" />
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} stroke={colorHex} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className={`absolute font-bold text-3xl ${getScoreColor(score)}`}>{score}</span>
    </div>
  )
}

function MiniScore({ score }) {
  const radius = 18
  const stroke = 3
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const dim = (radius + stroke) * 2
  const colorHex = score >= 80 ? '#00CAAA' : score >= 60 ? '#0073EC' : score >= 40 ? '#F59D00' : '#FF4A48'
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} stroke="rgba(67,79,88,0.3)" strokeWidth={stroke} fill="none" />
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} stroke={colorHex} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className={`absolute font-bold text-xs ${getScoreColor(score)}`}>{score}</span>
    </div>
  )
}

function SeverityBadge({ severity }) {
  const cls = severity === 'high' ? 'bg-coral/10 border-coral/20 text-coral' : severity === 'medium' ? 'bg-tangerine/10 border-tangerine/20 text-tangerine' : 'bg-metal/20 border-metal/30 text-galactic'
  return <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{severity}</span>
}

function Section({ title, score, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card-gradient border border-metal/20 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-cloudy">{icon}</span>
          <span className="font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <MiniScore score={score} />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-galactic transition-transform ${open ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </div>
      </button>
      {open && <div className="px-5 pb-5 border-t border-metal/10">{children}</div>}
    </div>
  )
}

const SAMPLE_TEXT = `Subject: 🎉 CONGRATULATIONS! You've Won a FREE Gift Card — Act NOW!!!

Dear Friend,

We're EXCITED to announce an INCREDIBLE opportunity just for YOU!

Click here to claim your FREE $500 Amazon Gift Card: https://bit.ly/claim-prize

This is a LIMITED TIME offer that expires TODAY! Don't miss out on this once-in-a-lifetime deal!!

Why wait? Act now and you could also win:
- A brand new iPhone
- $1000 cash bonus
- Free vacation package

No strings attached! No purchase necessary! 100% risk-free!

CLICK HERE NOW >>> https://bit.ly/winner-claims

This is NOT spam. We hate spam too!

Best regards,
The Prize Team`

const SAMPLE_HTML = `<html>
<body style="font-family: Arial, sans-serif;">
<div style="max-width: 600px; margin: 0 auto;">
  <h1 style="color: red; font-size: 28px;">🎉 CONGRATULATIONS! You've Won!!!</h1>
  <img src="https://example.com/banner.jpg">
  <p style="font-size: 16px;">Dear Friend,</p>
  <p>We're <strong>EXCITED</strong> to announce an <em>incredible</em> opportunity just for YOU!</p>
  <p><a href="https://bit.ly/claim-prize">Click here to claim your FREE Gift Card</a></p>
  <p style="color: red; font-size: 24px;">ACT NOW — LIMITED TIME OFFER!!!</p>
  <img src="https://example.com/prize.jpg">
  <img src="https://example.com/badge.png">
  <p>No strings attached! No purchase necessary! 100% risk-free!</p>
  <a href="https://bit.ly/winner">CLAIM YOUR PRIZE NOW</a>
</div>
</body>
</html>`

export default function App() {
  const [mode, setMode] = useState('plain')
  const [content, setContent] = useState('')
  const [subjectLine, setSubjectLine] = useState('')

  const result = analyzeContent(content, mode === 'html', subjectLine)

  const loadSample = () => {
    if (mode === 'html') {
      setContent(SAMPLE_HTML)
      setSubjectLine('🎉 CONGRATULATIONS! You\'ve Won a FREE Gift Card — Act NOW!!!')
    } else {
      setContent(SAMPLE_TEXT)
      setSubjectLine('🎉 CONGRATULATIONS! You\'ve Won a FREE Gift Card — Act NOW!!!')
    }
  }

  return (
    <div className="min-h-screen bg-abyss bg-glow bg-grid">
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
        <nav className="mb-8 text-sm text-galactic">
          <a href="https://seo-tools-tau.vercel.app/" className="text-azure hover:text-white transition-colors">Free Tools</a>
          <span className="mx-2 text-metal">/</span>
          <a href="https://seo-tools-tau.vercel.app/email-marketing/" className="text-azure hover:text-white transition-colors">Email Marketing</a>
          <span className="mx-2 text-metal">/</span>
          <span className="text-cloudy">Email Deliverability Checker</span>
        </nav>

        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 border border-turtle text-turtle rounded-full text-sm font-medium mb-6">Free Tool</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Email Deliverability Checker</h1>
          <p className="text-cloudy text-lg max-w-2xl mx-auto">Scan your email content for spam triggers, link issues, image problems, and compliance gaps — with a deliverability score and actionable fixes.</p>
        </div>

        {/* Input */}
        <div className="card-gradient border border-metal/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-midnight rounded-lg p-1">
              <button onClick={() => setMode('plain')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'plain' ? 'bg-azure text-white' : 'text-galactic hover:text-white'}`}>Plain Text</button>
              <button onClick={() => setMode('html')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'html' ? 'bg-azure text-white' : 'text-galactic hover:text-white'}`}>HTML Email</button>
            </div>
            <button onClick={loadSample} className="text-sm text-azure hover:text-white transition-colors">Load Sample</button>
          </div>

          <div className="mb-3">
            <label className="text-xs text-galactic block mb-1">Subject Line (optional)</label>
            <input type="text" value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} placeholder="Your email subject line..." className="w-full bg-midnight border border-metal/30 rounded-lg px-4 py-2.5 text-white placeholder-galactic focus:outline-none focus:border-azure transition-colors" />
          </div>

          <label className="text-xs text-galactic block mb-1">Email Body</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === 'html' ? 'Paste your HTML email code here...' : 'Paste your email content here...'}
            rows={10}
            className="w-full bg-midnight border border-metal/30 rounded-lg px-4 py-3 text-white placeholder-galactic focus:outline-none focus:border-azure transition-colors font-mono text-sm resize-y"
          />
          <p className="text-xs text-galactic mt-2">{content.split(/\s+/).filter(Boolean).length} words</p>
        </div>

        {/* Results */}
        {result ? (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="card-gradient border border-metal/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <ScoreCircle score={result.overall} />
              <div>
                <div className={`text-2xl font-bold ${getScoreColor(result.overall)}`}>{getVerdict(result.overall)}</div>
                <p className="text-cloudy mt-1">{result.wordCount} words analyzed</p>
                <p className="text-galactic text-sm mt-1">
                  {result.overall >= 80 ? 'This email is likely to reach the inbox. Minor tweaks could make it even better.' :
                   result.overall >= 60 ? 'Mostly safe, but address the flagged issues to improve deliverability.' :
                   result.overall >= 40 ? 'This email is at risk of being filtered. Review the issues below carefully.' :
                   'High spam risk. This email is likely to be caught by spam filters. Major changes needed.'}
                </p>
              </div>
            </div>

            {/* Spam Triggers */}
            <Section title="Spam Trigger Words" score={result.categories.spam.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>}>
              <div className="mt-3 space-y-3">
                {result.categories.spam.found.high.length === 0 && result.categories.spam.found.medium.length === 0 && result.categories.spam.found.low.length === 0 ? (
                  <p className="text-turtle text-sm">No spam triggers detected. Clean copy!</p>
                ) : (
                  <>
                    {result.categories.spam.found.high.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2"><SeverityBadge severity="high" /><span className="text-sm text-coral">{result.categories.spam.found.high.length} high-risk triggers</span></div>
                        <div className="flex flex-wrap gap-1">{result.categories.spam.found.high.map((w, i) => <span key={i} className="bg-coral/10 border border-coral/20 text-coral rounded px-2 py-0.5 text-xs">{w}</span>)}</div>
                      </div>
                    )}
                    {result.categories.spam.found.medium.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2"><SeverityBadge severity="medium" /><span className="text-sm text-tangerine">{result.categories.spam.found.medium.length} medium-risk triggers</span></div>
                        <div className="flex flex-wrap gap-1">{result.categories.spam.found.medium.map((w, i) => <span key={i} className="bg-tangerine/10 border border-tangerine/20 text-tangerine rounded px-2 py-0.5 text-xs">{w}</span>)}</div>
                      </div>
                    )}
                    {result.categories.spam.found.low.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2"><SeverityBadge severity="low" /><span className="text-sm text-galactic">{result.categories.spam.found.low.length} low-risk triggers</span></div>
                        <div className="flex flex-wrap gap-1">{result.categories.spam.found.low.map((w, i) => <span key={i} className="bg-metal/20 border border-metal/30 text-galactic rounded px-2 py-0.5 text-xs">{w}</span>)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Section>

            {/* Links */}
            <Section title="Link Analysis" score={result.categories.links.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>}>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-cloudy">{result.categories.links.count} link(s) found</p>
                {result.categories.links.issues.length === 0 ? (
                  <p className="text-sm text-turtle">Links look good!</p>
                ) : (
                  result.categories.links.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-cloudy">{issue.text}</span>
                    </div>
                  ))
                )}
              </div>
            </Section>

            {/* Images (HTML only) */}
            {result.categories.images.isHtml && (
              <Section title="Image-to-Text Ratio" score={result.categories.images.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>}>
                <div className="mt-3 space-y-2">
                  {result.categories.images.issues.length === 0 ? (
                    <p className="text-sm text-turtle">Image-to-text ratio looks balanced!</p>
                  ) : (
                    result.categories.images.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <SeverityBadge severity={issue.severity} />
                        <span className="text-cloudy">{issue.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            )}

            {/* Formatting */}
            <Section title="Formatting & Structure" score={result.categories.format.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>}>
              <div className="mt-3 space-y-2">
                {result.categories.format.issues.length === 0 ? (
                  <p className="text-sm text-turtle">Formatting looks clean!</p>
                ) : (
                  result.categories.format.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-cloudy">{issue.text}</span>
                    </div>
                  ))
                )}
              </div>
            </Section>

            {/* Compliance */}
            <Section title="CAN-SPAM Compliance" score={result.categories.compliance.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>}>
              <div className="mt-3 space-y-2">
                {result.categories.compliance.checks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={check.pass ? 'text-turtle' : 'text-coral'}>{check.pass ? '✓' : '✗'}</span>
                    <span className={check.pass ? 'text-cloudy' : 'text-coral'}>{check.label}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : (
          <div className="card-gradient border border-metal/20 rounded-2xl p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-galactic mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
            <p className="text-galactic text-lg">Paste your email content above to check deliverability</p>
            <p className="text-metal text-sm mt-2">Or click "Load Sample" to see an example analysis</p>
          </div>
        )}
      </div>

      <footer className="border-t border-metal/30 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-galactic">
          Free marketing tools by <a href="https://www.dreamhost.com" target="_blank" rel="noopener" className="text-azure hover:text-white transition-colors">DreamHost</a>
        </div>
      </footer>
    </div>
  )
}
