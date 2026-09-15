'use client'

import { useState, useEffect } from 'react'

interface EmailAccount {
  id: string
  provider: 'GMAIL' | 'OUTLOOK' | 'SMTP'
  email: string
  name: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)

  // SMTP Form Modal
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [smtpData, setSmtpData] = useState({
    email: '',
    name: 'Nexa Outreach',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    isDefault: false,
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email-accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleAddSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestResult(null)
    try {
      const res = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'SMTP',
          ...smtpData,
        }),
      })

      if (res.ok) {
        setShowSmtpModal(false)
        fetchAccounts()
      } else {
        const data = await res.json()
        setTestResult(data.error || 'Failed to connect SMTP account')
      }
    } catch (err) {
      setTestResult('Network error saving account')
    }
  }

  const handleConnectOAuth = (provider: string) => {
    alert(`Initiating ${provider} OAuth authentication flow... In production this redirects to Google/Microsoft OAuth consent screen.`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Email Accounts & Sending Configuration</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Connect your Google, Microsoft, or Custom SMTP accounts for outreach</p>
      </div>

      {/* Sending Limit Bar Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Daily Email Sending Quota</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Safety rate limit protection across all connected sending accounts</p>
          </div>
          <span className="badge badge-green" style={{ fontSize: '12px', padding: '4px 10px' }}>Healthy Status</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
          <span>Sent Today: <strong>245 / 500 Emails</strong></span>
          <span>49% Used</span>
        </div>
        <div style={{ width: '100%', background: '#334155', height: '8px', borderRadius: '4px' }}>
          <div style={{ width: '49%', background: '#2563eb', height: '100%', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Connected Accounts List */}
      <div className="card flex flex-col gap-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Connected Email Accounts</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleConnectOAuth('Gmail')} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              Connect Gmail (OAuth)
            </button>
            <button onClick={() => handleConnectOAuth('Outlook')} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              Connect Outlook
            </button>
            <button onClick={() => setShowSmtpModal(true)} className="btn btn-primary" style={{ fontSize: '13px' }}>
              + Add Custom SMTP
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {accounts.map(acc => (
            <div
              key={acc.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', background: acc.provider === 'GMAIL' ? '#fef2f2' : '#eff6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  color: acc.provider === 'GMAIL' ? '#dc2626' : '#2563eb'
                }}>
                  {acc.provider === 'GMAIL' ? 'G' : acc.provider === 'OUTLOOK' ? 'O' : 'SMTP'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {acc.email}
                    {acc.isDefault && <span className="badge badge-green" style={{ fontSize: '10px' }}>Default Sending Account</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {acc.name || 'Outreach Account'} • Provider: {acc.provider}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-blue">Connected & Active</span>
              </div>
            </div>
          ))}

          {accounts.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              No email accounts connected yet. Click above to connect Gmail, Outlook, or SMTP!
            </div>
          )}
        </div>
      </div>

      {/* SMTP Modal */}
      {showSmtpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '480px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Configure Custom SMTP Server</h2>

            {testResult && (
              <div style={{ padding: '10px', background: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {testResult}
              </div>
            )}

            <form onSubmit={handleAddSmtp} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Account Sender Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nexa Solutions Outreach"
                  value={smtpData.name}
                  onChange={(e) => setSmtpData({ ...smtpData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="outreach@nexasolutions.io"
                  value={smtpData.email}
                  onChange={(e) => setSmtpData({ ...smtpData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">SMTP Host *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="smtp.mailgun.org"
                    value={smtpData.smtpHost}
                    onChange={(e) => setSmtpData({ ...smtpData, smtpHost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">SMTP Port *</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={smtpData.smtpPort}
                    onChange={(e) => setSmtpData({ ...smtpData, smtpPort: parseInt(e.target.value) || 587 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">SMTP Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={smtpData.smtpUser}
                    onChange={(e) => setSmtpData({ ...smtpData, smtpUser: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">SMTP Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={smtpData.smtpPassword}
                    onChange={(e) => setSmtpData({ ...smtpData, smtpPassword: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowSmtpModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Connect SMTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
