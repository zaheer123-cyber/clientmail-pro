'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'security'>('profile')

  // Profile Form
  const [companyName, setCompanyName] = useState('Nexa Solutions')
  const [industry, setIndustry] = useState('Software & IT Solutions')
  const [website, setWebsite] = useState('https://nexasolutions.io')
  const [signature, setSignature] = useState(
    `Best Regards,\nJohn Doe\nNexa Solutions • Software & IT Solutions\nEmail: john@nexasolutions.io | Web: www.nexasolutions.io`
  )

  // AI Form
  const [aiKey, setAiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [defaultTone, setDefaultTone] = useState('Professional')
  const [defaultLanguage, setDefaultLanguage] = useState('English')

  const [savedMsg, setSavedMsg] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Application Settings</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Manage your company profile, email signature, AI provider keys, and security preferences</p>
      </div>

      {savedMsg && (
        <div style={{ padding: '12px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px' }}>
          ✓ Settings saved successfully!
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="card" style={{ padding: '8px', display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
            background: activeTab === 'profile' ? '#2563eb' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#64748b', border: 'none', cursor: 'pointer'
          }}
        >
          🏢 Company Profile & Signature
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          style={{
            padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
            background: activeTab === 'ai' ? '#2563eb' : 'transparent',
            color: activeTab === 'ai' ? 'white' : '#64748b', border: 'none', cursor: 'pointer'
          }}
        >
          ✨ AI Email Generator Settings
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
            background: activeTab === 'security' ? '#2563eb' : 'transparent',
            color: activeTab === 'security' ? 'white' : '#64748b', border: 'none', cursor: 'pointer'
          }}
        >
          🔒 Security & Password
        </button>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="card flex flex-col gap-5">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Company Outreach Branding</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Industry Specialization</label>
              <input
                type="text"
                className="form-input"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Official Website URL</label>
            <input
              type="text"
              className="form-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Default Email Signature</label>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Appended automatically to generated and sent emails</p>
            <textarea
              className="form-input"
              rows={5}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              Save Company Profile
            </button>
          </div>
        </form>
      )}

      {/* AI Settings Form */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSave} className="card flex flex-col gap-5">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>AI Integration & Configuration</h2>

          <div>
            <label className="form-label">OpenAI API Key (Optional Override)</label>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Leave blank to use system built-in AI provider</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="form-input"
                placeholder="sk-proj-..."
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Default AI Tone</label>
              <select
                className="form-input"
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
              >
                <option value="Professional">Professional</option>
                <option value="Persuasive">Persuasive</option>
                <option value="Friendly">Friendly</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="form-label">Default Language</label>
              <select
                className="form-input"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="German">German</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              Save AI Settings
            </button>
          </div>
        </form>
      )}

      {/* Security Form */}
      {activeTab === 'security' && (
        <form onSubmit={handleSave} className="card flex flex-col gap-5">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Change Account Password</h2>

          <div>
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" required />
          </div>

          <div>
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" required />
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              Update Password
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
