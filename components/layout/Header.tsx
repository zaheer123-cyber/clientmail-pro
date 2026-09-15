'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const sessionRes = useSession()
  const session = sessionRes?.data
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const notifications = [
    { id: 1, title: 'Email Opened', desc: 'Sarah Jenkins opened "Q4 IT Infrastructure Proposal"', time: '10m ago', unread: true },
    { id: 2, title: 'Email Replied', desc: 'Michael Chang replied to your follow-up', time: '1h ago', unread: true },
    { id: 3, title: 'Campaign Scheduled', desc: 'SaaS Outreach Q4 is set for tomorrow 09:00 AM', time: '3h ago', unread: false },
  ]

  return (
    <header className="header">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-xl font-bold text-slate-900">{title}</h1>}
      </div>

      {/* Global Search Bar */}
      <div className="header-search">
        <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search clients, emails, templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd style={{
          fontSize: '10px', background: '#f1f5f9', color: '#64748b',
          padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0'
        }}>⌘K</kbd>
      </div>

      {/* Action Controls */}
      <div className="header-actions">
        {/* Quick Compose Button */}
        <Link href="/compose" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Quick Compose
        </Link>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            style={{ width: '38px', height: '38px', padding: 0, justifyContent: 'center', position: 'relative' }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <svg width="18" height="18" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span style={{
              position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px',
              backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white'
            }} />
          </button>

          {showNotifications && (
            <div className="card shadow-lg" style={{
              position: 'absolute', right: 0, top: '48px', width: '320px', zIndex: 50,
              padding: 0, overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'
              }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                <span className="badge badge-blue">2 New</span>
              </div>
              <div>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                    backgroundColor: n.unread ? '#eff6ff' : 'white', cursor: 'pointer'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{n.desc}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Company / Workspace indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e'
          }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Nexa Solutions
          </span>
        </div>
      </div>
    </header>
  )
}
