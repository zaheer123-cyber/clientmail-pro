'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CampaignsPage() {
  const campaigns = [
    {
      id: 'c1',
      name: 'SaaS Tech Outreach Q4',
      status: 'RUNNING',
      progress: '48 / 120 (40%)',
      openRate: '65.4%',
      replyRate: '28.1%',
      createdAt: '2026-09-10'
    },
    {
      id: 'c2',
      name: 'IT Infra Upgrade Audit',
      status: 'SCHEDULED',
      progress: '0 / 45 (0%)',
      openRate: '0%',
      replyRate: '0%',
      createdAt: '2026-09-14'
    },
    {
      id: 'c3',
      name: 'Enterprise Custom Software',
      status: 'COMPLETED',
      progress: '250 / 250 (100%)',
      openRate: '78.2%',
      replyRate: '38.4%',
      createdAt: '2026-08-25'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Outreach Campaigns</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Automated bulk client sequence campaigns & tracking</p>
        </div>
        <button onClick={() => alert('New Campaign creation wizard!')} className="btn btn-primary">
          + Create New Campaign
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {campaigns.map(c => (
          <div key={c.id} className="card flex flex-col justify-between" style={{ minHeight: '200px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className={`badge ${c.status === 'RUNNING' ? 'badge-green' : c.status === 'SCHEDULED' ? 'badge-yellow' : 'badge-blue'}`}>
                  {c.status}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.createdAt}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{c.name}</h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                Progress: <strong style={{ color: '#1e293b' }}>{c.progress}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div>Open Rate: <strong style={{ color: '#22c55e' }}>{c.openRate}</strong></div>
              <div>Reply Rate: <strong style={{ color: '#2563eb' }}>{c.replyRate}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
