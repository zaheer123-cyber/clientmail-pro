'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getInitials, generateAvatarColor, formatDate } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email: string
  company: string | null
  position: string | null
  industry: string | null
  phone: string | null
  location: string | null
  requirement: string | null
  status: string
  tags: string[]
  isVip: boolean
  lastContactedAt: string | null
  createdAt: string
  _count?: { emails: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vipOnly, setVipOnly] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    position: '',
    industry: 'Software & IT Solutions',
    phone: '',
    location: '',
    requirement: '',
    status: 'NEW',
    isVip: false,
  })

  // History Drawer State
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null)

  const fetchClients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (vipOnly) params.set('vip', 'true')

      const res = await fetch(`/api/clients?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [search, statusFilter, vipOnly])

  const handleOpenAdd = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      company: '',
      position: '',
      industry: 'Software & IT Solutions',
      phone: '',
      location: '',
      requirement: '',
      status: 'NEW',
      isVip: false,
    })
    setShowModal(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company || '',
      position: client.position || '',
      industry: client.industry || 'Software & IT Solutions',
      phone: client.phone || '',
      location: client.location || '',
      requirement: client.requirement || '',
      status: client.status,
      isVip: client.isVip,
    })
    setShowModal(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        fetchClients()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save client')
      }
    } catch (err) {
      alert('Failed to save client')
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (res.ok) fetchClients()
    } catch (err) {
      alert('Failed to delete client')
    }
  }

  const exportCSV = () => {
    const headers = ['Name,Email,Company,Position,Industry,Phone,Location,Status,IsVIP\n']
    const rows = clients.map(c =>
      `"${c.name}","${c.email}","${c.company || ''}","${c.position || ''}","${c.industry || ''}","${c.phone || ''}","${c.location || ''}","${c.status}","${c.isVip}"\n`
    )
    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientmail-clients-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="badge badge-blue">New Lead</span>
      case 'CONTACTED':
        return <span className="badge badge-yellow">Contacted</span>
      case 'INTERESTED':
        return <span className="badge badge-green">Interested</span>
      case 'FOLLOW_UP':
        return <span className="badge badge-yellow">Follow-Up</span>
      case 'CONVERTED':
        return <span className="badge badge-green">Converted</span>
      case 'NOT_INTERESTED':
        return <span className="badge badge-red">Not Interested</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Client Management Directory</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Organize leads, track client status, and launch targeted outreach</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportCSV} className="btn btn-secondary">
            📥 Export CSV
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            + Add New Client
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="header-search" style={{ flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="form-input"
            style={{ width: '160px', fontSize: '13px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New Lead</option>
            <option value="CONTACTED">Contacted</option>
            <option value="INTERESTED">Interested</option>
            <option value="FOLLOW_UP">Follow-Up</option>
            <option value="CONVERTED">Converted</option>
            <option value="NOT_INTERESTED">Not Interested</option>
          </select>

          {/* VIP Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={vipOnly}
              onChange={(e) => setVipOnly(e.target.checked)}
            />
            ⭐ VIP Clients Only
          </label>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Client / Name</th>
              <th>Company & Position</th>
              <th>Contact Info</th>
              <th>Industry</th>
              <th>Status</th>
              <th>Emails Sent</th>
              <th>Last Contacted</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => {
              const avatarColor = generateAvatarColor(client.name)
              return (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className={`avatar ${avatarColor}`} style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {client.name}
                          {client.isVip && <span title="VIP Client">⭐</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{client.location || 'Location unmapped'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{client.company || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{client.position || 'Executive'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#2563eb' }}>{client.email}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{client.phone || 'No phone'}</div>
                  </td>
                  <td>
                    <span className="badge badge-gray" style={{ fontSize: '11px' }}>
                      {client.industry || 'IT Solutions'}
                    </span>
                  </td>
                  <td>{getStatusBadge(client.status)}</td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>
                    {client._count?.emails || 0}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {client.lastContactedAt ? formatDate(client.lastContactedAt) : 'Never'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/compose?clientId=${client.id}`}
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Compose
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {clients.length === 0 && !loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No clients found. Click <strong>"+ Add New Client"</strong> to add your first outreach lead!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {editingClient ? 'Edit Client Record' : 'Add New Client Lead'}
            </h2>

            <form onSubmit={handleSaveClient} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Position / Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Industry</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="NEW">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="INTERESTED">Interested</option>
                    <option value="FOLLOW_UP">Follow-Up</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isVip}
                      onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                    />
                    ⭐ Mark as VIP Client
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Requirements / Project Needs</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Interested in cloud infrastructure overhaul and custom API dev"
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
