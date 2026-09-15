'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Client {
  id: string
  name: string
  email: string
  company?: string | null
  position?: string | null
  industry?: string | null
  requirement?: string | null
}

interface Template {
  id: string
  name: string
  subject: string
  body: string
  category?: string
}

interface EmailAccount {
  id: string
  provider: string
  email: string
  name?: string | null
  isDefault: boolean
}

function ComposeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])

  // Selected values
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [toEmail, setToEmail] = useState('')
  const [toName, setToName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')

  // AI Assistant controls
  const [aiTone, setAiTone] = useState('Professional')
  const [aiLanguage, setAiLanguage] = useState('English')
  const [aiLength, setAiLength] = useState('Medium')
  const [aiPurpose, setAiPurpose] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  // Live preview & UI states
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('desktop')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cRes, tRes, aRes] = await Promise.all([
          fetch('/api/clients?limit=100'),
          fetch('/api/templates'),
          fetch('/api/email-accounts'),
        ])

        if (cRes.ok) {
          const data = await cRes.json()
          setClients(data.clients || [])
        }
        if (tRes.ok) {
          const data = await tRes.json()
          setTemplates(data.templates || [])
        }
        if (aRes.ok) {
          const data = await aRes.json()
          const accs = data.accounts || []
          setAccounts(accs)
          const def = accs.find((a: EmailAccount) => a.isDefault) || accs[0]
          if (def) setSelectedAccountId(def.id)
        }
      } catch (err) {
        console.error('Failed to load compose data:', err)
      }
    }
    loadInitialData()
  }, [])

  // Handle Client selection change
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    const found = clients.find(c => c.id === clientId)
    if (found) {
      setSelectedClient(found)
      setToEmail(found.email)
      setToName(found.name)
      if (found.requirement && !aiPurpose) {
        setAiPurpose(`Outreach for ${found.requirement}`)
      }
    } else {
      setSelectedClient(null)
    }
  }

  // Handle Template selection change
  const handleTemplateChange = (templateId: string) => {
    const found = templates.find(t => t.id === templateId)
    if (found) {
      setSubject(found.subject)
      setBody(found.body)
    }
  }

  // Insert Variable into body
  const insertVariable = (varName: string) => {
    setBody(prev => prev + ` {{${varName}}}`)
  }

  // Generate Email using AI Service
  const handleGenerateAI = async () => {
    if (!toEmail && !selectedClient) {
      setNotification({ type: 'error', message: 'Please select or enter a client email first.' })
      return
    }

    setGenerating(true)
    setNotification(null)

    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient?.name || toName || 'Valued Client',
          clientEmail: toEmail,
          clientCompany: selectedClient?.company || 'Target Company',
          clientPosition: selectedClient?.position || '',
          clientIndustry: selectedClient?.industry || 'Technology',
          clientRequirement: selectedClient?.requirement || aiPurpose || 'Software & IT Solutions',
          purpose: aiPurpose || 'Professional Business Outreach & Collaboration',
          tone: aiTone,
          language: aiLanguage,
          length: aiLength,
          senderName: 'John Doe',
          senderCompany: 'Nexa Solutions',
        }),
      })

      const data = await res.json()
      if (res.ok && data.subject && data.body) {
        setSubject(data.subject)
        setBody(data.body)
        setNotification({ type: 'success', message: '✨ Email content generated successfully!' })
      } else {
        setNotification({ type: 'error', message: data.error || 'AI generation failed.' })
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to generate AI email.' })
    } finally {
      setGenerating(false)
    }
  }

  // Send Email Action
  const handleSend = async (isDraft = false, scheduleTime?: string) => {
    if (!toEmail || !subject || !body || !selectedAccountId) {
      setNotification({ type: 'error', message: 'Please complete recipient, account, subject, and body fields.' })
      return
    }

    setSending(true)
    setNotification(null)

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          toName: toName || undefined,
          subject,
          body,
          emailAccountId: selectedAccountId,
          clientId: selectedClientId || undefined,
          isDraft,
          scheduledAt: scheduleTime || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        if (scheduleTime) {
          setNotification({ type: 'success', message: '📅 Email scheduled successfully!' })
          setShowScheduleModal(false)
        } else if (isDraft) {
          setNotification({ type: 'success', message: '💾 Saved as Draft!' })
        } else {
          setNotification({ type: 'success', message: '🚀 Email sent successfully to ' + toEmail })
          setTimeout(() => router.push('/sent'), 1500)
        }
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to process email action.' })
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'An unexpected error occurred.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Compose Personalized Outreach</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Craft AI-powered personalized emails or pick from verified templates</p>
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: notification.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {notification.message}
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Form & AI Panel */}
        <div className="col-span-7 flex flex-col gap-5">
          {/* Client & Template Selectors */}
          <div className="card grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Select Client</label>
              <select
                className="form-input"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
              >
                <option value="">-- Choose Client or Custom --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Load Template</label>
              <select
                className="form-input"
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="">-- Blank / Custom --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Recipient Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="client@company.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Smith"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
              />
            </div>
          </div>

          {/* AI Email Assistant Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ background: '#2563eb', color: 'white', padding: '6px', borderRadius: '6px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>AI Email Generator & Polish</h3>
                <p style={{ fontSize: '11px', color: '#3b82f6' }}>Generate customized outreach tailored to client profile & IT services</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Tone Selection */}
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Tone of Voice</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Professional', 'Persuasive', 'Friendly', 'Executive', 'Consultative'].map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setAiTone(tone)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                        background: aiTone === tone ? '#2563eb' : 'white',
                        color: aiTone === tone ? 'white' : '#475569',
                        border: `1px solid ${aiTone === tone ? '#2563eb' : '#cbd5e1'}`,
                        cursor: 'pointer'
                      }}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose / Requirements */}
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Outreach Goal / Key Talking Points</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Propose custom web app development & cloud migration for their expanding infrastructure"
                  value={aiPurpose}
                  onChange={(e) => setAiPurpose(e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-input"
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px', width: '100px' }}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                  </select>

                  <select
                    className="form-input"
                    value={aiLength}
                    onChange={(e) => setAiLength(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px', width: '100px' }}
                  >
                    <option value="Short">Short</option>
                    <option value="Medium">Medium</option>
                    <option value="Detailed">Detailed</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateAI}
                  disabled={generating}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {generating ? '✨ Generating...' : '✨ Generate with AI'}
                </button>
              </div>
            </div>
          </div>

          {/* Email Subject & Variables */}
          <div className="card flex flex-col gap-4">
            <div>
              <label className="form-label">Subject Line *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Custom Software & Cloud Migration Solutions for {{company}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Variable Pills Toolbar */}
            <div>
              <label className="form-label" style={{ fontSize: '11px', color: '#64748b' }}>Insert Variables into Body</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '+ Client Name', var: 'client_name' },
                  { label: '+ Company', var: 'company' },
                  { label: '+ Industry', var: 'industry' },
                  { label: '+ Requirement', var: 'requirement' },
                  { label: '+ Sender Company', var: 'sender_company' },
                ].map(item => (
                  <button
                    key={item.var}
                    type="button"
                    onClick={() => insertVariable(item.var)}
                    style={{
                      padding: '3px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                      borderRadius: '4px', fontSize: '11px', color: '#334155', cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rich Email Body Editor */}
            <div>
              <label className="form-label">Email Body Content *</label>
              <textarea
                className="form-input"
                rows={10}
                placeholder="Dear {{client_name}},\n\nI noticed that {{company}} is expanding its IT solutions..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '1.6' }}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Live Preview & Accounts & Actions */}
        <div className="col-span-5 flex flex-col gap-5">
          {/* Sending Account Selector */}
          <div className="card">
            <label className="form-label">Send From Email Account</label>
            <select
              className="form-input"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name || acc.email} ({acc.provider}) {acc.isDefault ? '• Default' : ''}
                </option>
              ))}
              {accounts.length === 0 && (
                <option value="">No email accounts connected - Go to Email Accounts to connect</option>
              )}
            </select>
          </div>

          {/* Live Preview Tabs */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Live Email Preview</span>
              <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewTab('desktop')}
                  style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                    background: previewTab === 'desktop' ? 'white' : 'transparent',
                    color: previewTab === 'desktop' ? '#0f172a' : '#64748b', border: 'none', cursor: 'pointer'
                  }}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('mobile')}
                  style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                    background: previewTab === 'mobile' ? 'white' : 'transparent',
                    color: previewTab === 'mobile' ? '#0f172a' : '#64748b', border: 'none', cursor: 'pointer'
                  }}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div style={{
              padding: previewTab === 'mobile' ? '16px 24px' : '20px',
              maxWidth: previewTab === 'mobile' ? '320px' : '100%',
              margin: '0 auto', background: previewTab === 'mobile' ? '#f1f5f9' : 'white',
              minHeight: '280px', borderRadius: previewTab === 'mobile' ? '16px' : '0',
              border: previewTab === 'mobile' ? '8px solid #334155' : 'none'
            }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', fontSize: '12px' }}>
                <div><strong style={{ color: '#64748b' }}>To:</strong> {toEmail || 'recipient@client.com'}</div>
                <div><strong style={{ color: '#64748b' }}>Subject:</strong> {subject || '(No subject set)'}</div>
              </div>

              <div style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {body ? (
                  body
                    .replace(/\{\{client_name\}\}/g, selectedClient?.name || toName || 'John')
                    .replace(/\{\{company\}\}/g, selectedClient?.company || 'Acme Tech')
                    .replace(/\{\{industry\}\}/g, selectedClient?.industry || 'IT')
                    .replace(/\{\{requirement\}\}/g, selectedClient?.requirement || 'Custom Solutions')
                    .replace(/\{\{sender_company\}\}/g, 'Nexa Solutions')
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Email preview will render live here as you compose or generate content...
                  </span>
                )}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b' }}>
                <div>Best Regards,</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>John Doe</div>
                <div>Nexa Solutions • Software & IT Solutions</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>www.nexasolutions.io</div>
              </div>
            </div>
          </div>

          {/* Selected Client Overview Info */}
          {selectedClient && (
            <div className="card" style={{ background: '#f8fafc' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Client Details Sidebar
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedClient.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedClient.position || 'Executive'} • {selectedClient.company || 'N/A'}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Industry: {selectedClient.industry || 'IT Solutions'}</div>
              {selectedClient.requirement && (
                <div style={{ marginTop: '8px', padding: '8px', background: '#eff6ff', borderRadius: '6px', fontSize: '11px', color: '#1e40af' }}>
                  <strong>Requirements:</strong> {selectedClient.requirement}
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="card flex flex-col gap-3">
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px' }}
              onClick={() => handleSend(false)}
              disabled={sending}
            >
              {sending ? 'Sending...' : '🚀 Send Email Now'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => setShowScheduleModal(true)}
              >
                📅 Schedule Send
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => handleSend(true)}
                disabled={sending}
              >
                💾 Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Schedule Email Delivery</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Pick a future date and time to automatically dispatch this email.</p>

            <label className="form-label">Select Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSend(false, scheduledAt)}
                disabled={!scheduledAt || sending}
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: '#64748b' }}>Loading compose interface...</div>}>
      <ComposeContent />
    </Suspense>
  )
}
