import { useState } from 'react'
import { analyzeContent, SAMPLE_TEXT, SAMPLE_HTML } from './deliverabilityAnalysis'
import OverallScore from './components/OverallScore'
import SpamTriggerResults from './components/SpamTriggerResults'
import LinkAnalysis from './components/LinkAnalysis'
import ComplianceChecklist from './components/ComplianceChecklist'
import ScoreSection from './components/ScoreSection'
import SeverityBadge from './components/SeverityBadge'

export default function App() {
  const [mode, setMode] = useState('plain')
  const [content, setContent] = useState('')
  const [subjectLine, setSubjectLine] = useState('')

  const fillTestData = () => {
    setMode('html')
    setSubjectLine('Your March Newsletter — 3 Tips to Boost Your Website Traffic')
    setContent(`<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
<div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #0073EC; padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Your Monthly Marketing Digest</h1>
  </div>
  <div style="padding: 30px;">
    <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi there,</p>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">Here are 3 proven strategies to grow your website traffic this month:</p>
    <img src="https://example.com/newsletter-banner.jpg" alt="Marketing tips banner" style="width: 100%; border-radius: 8px;" />
    <h2 style="color: #333; font-size: 20px;">1. Optimize Your Blog for SEO</h2>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">Focus on long-tail keywords your audience is actually searching for. Tools like Google Search Console can reveal quick wins.</p>
    <h2 style="color: #333; font-size: 20px;">2. Repurpose Content Across Channels</h2>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">Turn your best blog posts into social media carousels, email series, or short videos to reach more people without creating from scratch.</p>
    <h2 style="color: #333; font-size: 20px;">3. Improve Your Page Speed</h2>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">A one-second delay in page load can reduce conversions by 7%. Use our <a href="https://example.com/speed-tool" style="color: #0073EC;">free speed checker</a> to find issues.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://example.com/full-guide" style="background: #0073EC; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Read the Full Guide</a>
    </div>
    <p style="font-size: 16px; color: #333; line-height: 1.6;">Questions? Just reply to this email — we read every message.</p>
    <p style="font-size: 16px; color: #333;">Best regards,<br><strong>The DreamHost Marketing Team</strong></p>
  </div>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
    <p>Sent by DreamHost, 417 Associated Rd, Brea, CA 92821</p>
    <p><a href="https://example.com/unsubscribe" style="color: #0073EC;">Unsubscribe</a> | <a href="https://example.com/preferences" style="color: #0073EC;">Manage Preferences</a></p>
  </div>
</div>
</body>
</html>`)
  }

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

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={fillTestData}
            className="px-3 py-1.5 text-xs font-mono bg-prince/20 text-prince border border-prince/30 rounded hover:bg-prince/30 transition-colors focus:outline-none focus:ring-2 focus:ring-prince focus:ring-offset-2 focus:ring-offset-abyss"
          >
            Fill Test Data
          </button>
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
            <OverallScore result={result} />
            <SpamTriggerResults spam={result.categories.spam} />
            <LinkAnalysis links={result.categories.links} />

            {/* Images (HTML only) */}
            {result.categories.images.isHtml && (
              <ScoreSection title="Image-to-Text Ratio" score={result.categories.images.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>}>
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
              </ScoreSection>
            )}

            {/* Formatting */}
            <ScoreSection title="Formatting & Structure" score={result.categories.format.score} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>}>
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
            </ScoreSection>

            <ComplianceChecklist compliance={result.categories.compliance} />
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
        <div className="max-w-[1600px] mx-auto px-4 py-6 text-center text-sm text-galactic">
          Free marketing tools by <a href="https://www.dreamhost.com" target="_blank" rel="noopener" className="text-azure hover:text-white transition-colors">DreamHost</a>
        </div>
      </footer>
    </div>
  )
}
