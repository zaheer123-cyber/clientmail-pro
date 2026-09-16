'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmailAccount {
  id: string
  provider: 'GMAIL' | 'OUTLOOK' | 'SMTP'
  email: string
  name: string | null
  status: 'CONNECTED' | 'ERROR' | 'DISCONNECTED'
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

type SmtpForm = { email: string; name: string; smtpHost: string; smtpPort: number; smtpUser: string; smtpPassword: string; smtpSecurity: 'SSL' | 'STARTTLS' | 'NONE'; isDefault: boolean }
const emptySmtp: SmtpForm = { email: '', name: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', smtpSecurity: 'STARTTLS', isDefault: false }

export default function EmailAccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [smtpData, setSmtpData] = useState<SmtpForm>(emptySmtp)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchAccounts() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/email-accounts', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load email accounts')
      setAccounts(data.accounts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchAccounts() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('connected') === '1') setNotice('Email account connected successfully.')
      if (params.get('error')) setError(params.get('error'))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  async function testSmtp() {
    setTesting(true); setError(null); setNotice(null)
    try {
      const response = await fetch('/api/email-accounts/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(smtpData) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'SMTP connection failed')
      setNotice('SMTP connection verified. You can save this account.')
    } catch (err) { setError(err instanceof Error ? err.message : 'SMTP connection failed') } finally { setTesting(false) }
  }

  async function saveSmtp(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(null); setNotice(null)
    try {
      const response = await fetch('/api/email-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'SMTP', ...smtpData }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save SMTP account')
      setShowSmtpModal(false); setSmtpData(emptySmtp); setNotice('SMTP account connected.'); await fetchAccounts()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save SMTP account') } finally { setSaving(false) }
  }

  async function accountAction(id: string, action: 'default' | 'disconnect' | 'reconnect') {
    setError(null); setNotice(null)
    const response = await fetch('/api/email-accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Account update failed'); return }
    setNotice(action === 'default' ? 'Default sending account updated.' : action === 'disconnect' ? 'Account disconnected.' : 'Account reconnected.')
    await fetchAccounts()
  }

  async function deleteAccount(id: string) {
    setError(null); setNotice(null)
    const response = await fetch(`/api/email-accounts?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) { setError(data.error || 'Account deletion failed'); return }
    setNotice('Account deleted.'); await fetchAccounts()
  }

  function reconnectAccount(account: EmailAccount) {
    if (account.provider === 'GMAIL' || account.provider === 'OUTLOOK') {
      router.push(`/api/email-accounts/oauth/${account.provider === 'GMAIL' ? 'gmail' : 'outlook'}`)
      return
    }
    void accountAction(account.id, 'reconnect')
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div><h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Email Accounts & Sending Configuration</h1><p style={{ fontSize: '13px', color: '#64748b' }}>Connect a verified account for outreach. Credentials stay encrypted on the server.</p></div>
    {error && <div role="alert" style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '6px' }}>{error}</div>}
    {notice && <div role="status" style={{ padding: '12px', background: '#ecfdf5', color: '#047857', borderRadius: '6px' }}>{notice}</div>}
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
        <div><h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Connected Email Accounts</h2><p style={{ fontSize: '12px', color: '#64748b' }}>OAuth providers require configured server credentials.</p></div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/api/email-accounts/oauth/gmail')} className="btn btn-secondary">Connect Gmail</button>
          <button onClick={() => router.push('/api/email-accounts/oauth/outlook')} className="btn btn-secondary">Connect Outlook</button>
          <button onClick={() => { setError(null); setNotice(null); setShowSmtpModal(true) }} className="btn btn-primary">Add SMTP</button>
        </div>
      </div>
      <div className="flex flex-col gap-3" style={{ marginTop: '16px' }}>
        {loading && <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading connected accounts...</div>}
        {!loading && accounts.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No connected accounts yet.</div>}
        {!loading && accounts.map(account => <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div><div style={{ fontWeight: 600, color: '#0f172a' }}>{account.email} {account.isDefault && <span className="badge badge-green">Default</span>}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{account.name || 'Sending account'} • {account.provider}</div></div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${account.status === 'CONNECTED' ? 'badge-green' : account.status === 'ERROR' ? 'badge-red' : 'badge-gray'}`}>{account.status}</span>
            {!account.isDefault && account.status === 'CONNECTED' && <button className="btn btn-secondary" onClick={() => void accountAction(account.id, 'default')}>Set default</button>}
            {account.status === 'CONNECTED' ? <button className="btn btn-secondary" onClick={() => void accountAction(account.id, 'disconnect')}>Disconnect</button> : <button className="btn btn-secondary" onClick={() => reconnectAccount(account)}>Reconnect</button>}
            <button className="btn btn-secondary" onClick={() => void deleteAccount(account.id)}>Delete</button>
          </div>
        </div>)}
      </div>
    </div>
    {showSmtpModal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}><div className="card" style={{ width: '520px', maxWidth: '100%' }}><h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Configure SMTP</h2><form onSubmit={saveSmtp} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4"><div><label className="form-label">From email *</label><input required type="email" className="form-input" value={smtpData.email} onChange={event => setSmtpData({ ...smtpData, email: event.target.value })} /></div><div><label className="form-label">From name *</label><input required className="form-input" value={smtpData.name} onChange={event => setSmtpData({ ...smtpData, name: event.target.value })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><label className="form-label">SMTP host *</label><input required className="form-input" value={smtpData.smtpHost} onChange={event => setSmtpData({ ...smtpData, smtpHost: event.target.value })} /></div><div><label className="form-label">Port *</label><input required type="number" className="form-input" value={smtpData.smtpPort} onChange={event => setSmtpData({ ...smtpData, smtpPort: Number(event.target.value) })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><label className="form-label">Username *</label><input required className="form-input" value={smtpData.smtpUser} onChange={event => setSmtpData({ ...smtpData, smtpUser: event.target.value })} /></div><div><label className="form-label">Password *</label><input required type="password" className="form-input" value={smtpData.smtpPassword} onChange={event => setSmtpData({ ...smtpData, smtpPassword: event.target.value })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div><label className="form-label">Security</label><select className="form-input" value={smtpData.smtpSecurity} onChange={event => setSmtpData({ ...smtpData, smtpSecurity: event.target.value as SmtpForm['smtpSecurity'] })}><option value="STARTTLS">STARTTLS</option><option value="SSL">SSL/TLS</option><option value="NONE">None</option></select></div><label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '24px' }}><input type="checkbox" checked={smtpData.isDefault} onChange={event => setSmtpData({ ...smtpData, isDefault: event.target.checked })} /> Make default</label></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><button type="button" className="btn btn-secondary" onClick={() => setShowSmtpModal(false)}>Cancel</button><button type="button" className="btn btn-secondary" disabled={testing} onClick={() => void testSmtp()}>{testing ? 'Testing...' : 'Test connection'}</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save account'}</button></div>
    </form></div></div>}
  </div>
}
