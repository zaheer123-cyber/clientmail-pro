'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { getInitials, generateAvatarColor, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalEmails: number
  deliveredEmails: number
  openedEmails: number
  repliedEmails: number
  scheduledCount: number
  clientCount: number
}

interface RecentEmail {
  id: string
  recipientName: string
  recipientEmail: string
  subject: string
  status: string
  sentAt: string | null
  createdAt: string
  client?: { name: string; company: string | null }
}

const chartData = [
  { day: 'Mon', sent: 45, opened: 32, replied: 14 },
  { day: 'Tue', sent: 68, opened: 54, replied: 22 },
  { day: 'Wed', sent: 92, opened: 71, replied: 35 },
  { day: 'Thu', sent: 110, opened: 88, replied: 41 },
  { day: 'Fri', sent: 85, opened: 65, replied: 28 },
  { day: 'Sat', sent: 30, opened: 21, replied: 8 },
  { day: 'Sun', sent: 25, opened: 18, replied: 6 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 1482,
    deliveredEmails: 1340,
    openedEmails: 890,
    repliedEmails: 420,
    scheduledCount: 124,
    clientCount: 86,
  })
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          if (data.stats) setStats(data.stats)
          if (data.recentEmails) setRecentEmails(data.recentEmails)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const sampleRecentEmails: RecentEmail[] = [
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
    {
      id: '3',
      recipientName: 'Elena Rostova',
      recipientEmail: 'elena@cyberdefense.net',
      subject: 'Cybersecurity Audit & Compliance Readiness',
      status: 'SENT',
      sentAt: new Date(Date.now() - 14400000).toISOString(),
      createdAt: new Date().toISOString(),
      client: { name: 'Elena Rostova', company: 'CyberDefense' }
    },
    {
      id: '4',
      recipientName: 'David Miller',
      recipientEmail: 'dmiller@apexlogistics.com',
      subject: 'AI Automated Workflow Integration Demonstration',
      status: 'OPENED',
      sentAt: new Date(Date.now() - 28800000).toISOString(),
      createdAt: new Date().toISOString(),
      client: { name: 'David Miller', company: 'Apex Logistics' }
    },
    {
      id: '5',
      recipientName: 'Amanda Lewis',
      recipientEmail: 'alewis@fintechhub.com',
      subject: 'Custom Mobile Application Development Services',
      status: 'SCHEDULED',
      sentAt: null,
      createdAt: new Date().toISOString(),
      client: { name: 'Amanda Lewis', company: 'Fintech Hub' }
    },
  ]

  const displayEmails = recentEmails.length > 0 ? recentEmails : sampleRecentEmails

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPENED':
        return <span className="badge badge-green">Opened</span>
      case 'REPLIED':
        return <span className="badge badge-blue">Replied</span>
      case 'SENT':
      case 'DELIVERED':
        return <span className="badge badge-blue">Sent</span>
      case 'SCHEDULED':
        return <span className="badge badge-yellow">Scheduled</span>
      case 'FAILED':
      case 'BOUNCED':
        return <span className="badge badge-red">Failed</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white', padding: '24px 32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(15,23,42,0.15)'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            Welcome back to ClientMail Pro 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Nexa Solutions • Automated outreach performance overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/compose" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Compose New Email
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Total Outreach</span>
            <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{stats.totalEmails.toLocaleString()}</div>
          <div className="metric-change positive">
            <span>↑ 12.5%</span> vs last month
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Emails Delivered</span>
            <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{stats.deliveredEmails.toLocaleString()}</div>
          <div className="metric-change positive">
            <span>90.4%</span> delivery rate
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Response Rate</span>
            <div style={{ padding: '8px', background: '#faf5ff', borderRadius: '8px', color: '#9333ea' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">
            {((stats.repliedEmails / (stats.totalEmails || 1)) * 100).toFixed(1)}%
          </div>
          <div className="metric-change positive">
            <span>↑ 4.1%</span> engagement boost
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Scheduled Queue</span>
            <div style={{ padding: '8px', background: '#fefce8', borderRadius: '8px', color: '#ca8a04' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{stats.scheduledCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Ready for automated dispatch
          </div>
        </div>
      </div>

      {/* Main Charts & Quick Status Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Outreach Performance Chart */}
        <div className="card col-span-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Outreach Performance</h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Emails sent vs opened vs replied (This Week)</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-blue">Sent</span>
              <span className="badge badge-green">Opened</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="opened" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorOpened)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Campaigns Status Sidebar */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Active Campaigns</h2>
            <Link href="/campaigns" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>View All →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>SaaS Tech Outreach Q4</span>
                <span className="badge badge-green">Active</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                48 / 120 Emails sent • 65% Open Rate
              </div>
              <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '6px' }}>
                <div style={{ width: '40%', background: '#2563eb', height: '100%', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>IT Infra Upgrade Audit</span>
                <span className="badge badge-yellow">Scheduled</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                Launches tomorrow at 09:00 AM • 45 clients
              </div>
              <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '6px' }}>
                <div style={{ width: '0%', background: '#ca8a04', height: '100%', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Enterprise Custom Software</span>
                <span className="badge badge-blue">Completed</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                250 / 250 Sent • 78% Delivered • 42 Replies
              </div>
              <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '6px' }}>
                <div style={{ width: '100%', background: '#22c55e', height: '100%', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Outreach Activity Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Recent Outreach Activity</h2>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Latest emails generated & sent to client accounts</p>
          </div>
          <Link href="/sent" className="btn btn-secondary" style={{ fontSize: '13px' }}>
            View Sent History
          </Link>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Company</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayEmails.map(item => {
              const name = item.client?.name || item.recipientName || 'Client'
              const company = item.client?.company || 'N/A'
              const colorClass = generateAvatarColor(name)
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className={`avatar ${colorClass}`} style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                        {getInitials(name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{item.recipientEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontSize: '13px' }}>{company}</td>
                  <td>
                    <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1e293b', fontSize: '13px', fontWeight: 500 }}>
                      {item.subject}
                    </div>
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>
                    {item.sentAt ? formatDate(item.sentAt) : 'Scheduled'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link href={`/compose?clientId=${item.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                        Re-send
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
