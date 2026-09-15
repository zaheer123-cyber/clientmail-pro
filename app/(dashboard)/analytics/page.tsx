'use client'

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const timeSeriesData = [
  { date: 'Sep 01', sent: 120, opened: 82, clicked: 34, replied: 28 },
  { date: 'Sep 03', sent: 180, opened: 130, clicked: 52, replied: 44 },
  { date: 'Sep 05', sent: 210, opened: 155, clicked: 68, replied: 58 },
  { date: 'Sep 07', sent: 160, opened: 112, clicked: 48, replied: 39 },
  { date: 'Sep 09', sent: 240, opened: 178, clicked: 85, replied: 62 },
  { date: 'Sep 11', sent: 290, opened: 215, clicked: 104, replied: 88 },
  { date: 'Sep 13', sent: 282, opened: 204, clicked: 98, replied: 79 },
]

const templatePerformance = [
  { name: 'Cold Outreach Q4', opens: 240, replies: 95 },
  { name: 'IT Audit Follow-Up', opens: 180, replies: 72 },
  { name: 'Cloud Migration Pitch', opens: 150, replies: 64 },
  { name: 'Mobile App Proposal', opens: 110, replies: 42 },
  { name: 'Re-engagement', opens: 85, replies: 28 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Outreach Analytics & Reports</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>In-depth insights on delivery, open rates, response engagement, and template efficacy</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`btn ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              Last {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card metric-card">
          <span className="metric-title">Open Rate</span>
          <div className="metric-value">68.4%</div>
          <div className="metric-change positive">
            <span>↑ 5.2%</span> vs average benchmark
          </div>
        </div>

        <div className="card metric-card">
          <span className="metric-title">Click-Through Rate</span>
          <div className="metric-value">24.1%</div>
          <div className="metric-change positive">
            <span>↑ 2.8%</span> high CTA engagement
          </div>
        </div>

        <div className="card metric-card">
          <span className="metric-title">Response Rate</span>
          <div className="metric-value">34.2%</div>
          <div className="metric-change positive">
            <span>↑ 4.1%</span> positive client replies
          </div>
        </div>

        <div className="card metric-card">
          <span className="metric-title">Bounce Rate</span>
          <div className="metric-value" style={{ color: '#16a34a' }}>1.2%</div>
          <div className="metric-change positive">
            <span>↓ 0.4%</span> domain score healthy
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Deliverability & Engagement Timeline Chart */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
            Outreach Funnel Performance
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
            Emails Sent vs Opened vs Clicked vs Replied
          </p>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: 'white' }} />
                <Legend />
                <Area type="monotone" dataKey="sent" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} name="Sent" />
                <Area type="monotone" dataKey="opened" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Opened" />
                <Area type="monotone" dataKey="replied" stroke="#9333ea" fill="#9333ea" fillOpacity={0.15} name="Replied" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Email Templates Bar Chart */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
            Top Performing Templates
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
            Opens vs Direct Client Replies per template
          </p>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templatePerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: 'white' }} />
                <Legend />
                <Bar dataKey="opens" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Opens" />
                <Bar dataKey="replies" fill="#22c55e" radius={[4, 4, 0, 0]} name="Client Replies" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
