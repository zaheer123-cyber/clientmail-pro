'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DraftsPage() {
  const drafts = [
    {
      id: 'd1',
      recipientEmail: 'alex.v@nexgen.io',
      recipientName: 'Alex Vance',
      subject: 'Follow-Up: Enterprise DevOps Pipeline Modernization',
      updatedAt: '2 hours ago'
    },
    {
      id: 'd2',
      recipientEmail: 'cto@scaleup.tech',
      recipientName: 'CTO Office',
      subject: 'Scalable Microservices & Backend API Refactoring Proposal',
      updatedAt: 'Yesterday'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Saved Draft Emails</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Resume editing or complete unfinished email compositions</p>
        </div>
        <Link href="/compose" className="btn btn-primary">
          + Compose New Email
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Last Saved</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{d.recipientName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{d.recipientEmail}</div>
                </td>
                <td style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{d.subject}</td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{d.updatedAt}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/compose?draftId=${d.id}`} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    Resume Editing
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
