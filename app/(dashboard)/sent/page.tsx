'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SentEmail {
  id: string
  recipientName: string | null
  recipientEmail: string
  subject: string
  status: string
  sentAt: string | null
  createdAt: string
  client?: { name: string; company: string | null }
}

export default function SentEmailsPage() {
  const [emails, setEmails] = useState<SentEmail[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    // In demo or live API
    async function loadSent() {
      try {
        const res = await fetch('/api/emails?status=SENT')
        if (res.ok) {
          const data = await res.json()
          setEmails(data.emails || [])
        }
      } catch (err) {
        console.error('Failed to fetch sent emails:', err)
      }
    }
    loadSent()
  }, [])

  const sampleSent: SentEmail[] = [
    {
      id: '1',
      recipientName: 'Sarah Jenkins',
      recipientEmail: 'sarah.j@techcorp.io',
      subject: 'Custom Cloud Architecture & Scalability Solutions for TechCorp',
      status: 'OPENED',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      client: { name: 'Sarah Jenkins', company: 'TechCorp Solutions' }
    },
    {
      id: '2',
      recipientName: 'Michael Chang',
      recipientEmail: 'mchang@innovate.co',
      subject: 'Re: Enterprise Software Development Proposal',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date().toISOString(),
      client: { name: 'Michael Chang', company: 'Innovate Co' }
    },
  ]

  const displayList = emails.length > 0 ? emails : sampleSent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Sent Email Outbox History</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Track delivery, open events, and client reply status</p>
        </div>
        <Link href="/compose" className="btn btn-primary">
          + Compose Email
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Company</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Sent Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.recipientName || 'Client'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{item.recipientEmail}</div>
                </td>
                <td style={{ fontSize: '13px', color: '#475569' }}>{item.client?.company || 'N/A'}</td>
                <td style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{item.subject}</td>
                <td>
                  <span className={`badge ${item.status === 'REPLIED' ? 'badge-blue' : 'badge-green'}`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{item.sentAt ? formatDate(item.sentAt) : 'N/A'}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/compose?clientId=${item.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    Re-send
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
