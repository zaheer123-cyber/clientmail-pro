'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  category: string
  language: string
  tone: string
  isFavorite: boolean
  useCount: number
  description?: string | null
}

const CATEGORIES = [
  'All',
  'Cold Outreach',
  'Follow-Up',
  'Proposal',
  'Onboarding',
  'Re-engagement',
  'Favorites',
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'Cold Outreach',
    language: 'English',
    tone: 'Professional',
    description: '',
  })

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory === 'Favorites') params.set('favorites', 'true')
      else if (selectedCategory !== 'All') params.set('category', selectedCategory)

      const res = await fetch(`/api/templates?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, search])

  const handleOpenAdd = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      subject: '',
      body: '',
      category: 'Cold Outreach',
      language: 'English',
      tone: 'Professional',
      description: '',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (t: Template) => {
    setEditingTemplate(t)
    setFormData({
      name: t.name,
      subject: t.subject,
      body: t.body,
      category: t.category,
      language: t.language,
      tone: t.tone,
      description: t.description || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates'
      const method = editingTemplate ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        fetchTemplates()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save template')
      }
    } catch (err) {
      alert('Failed to save template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (res.ok) fetchTemplates()
    } catch (err) {
      alert('Failed to delete template')
    }
  }

  const toggleFavorite = async (t: Template) => {
    try {
      const res = await fetch(`/api/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !t.isFavorite }),
      })
      if (res.ok) fetchTemplates()
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const insertVariable = (varName: string) => {
    setFormData(prev => ({ ...prev, body: prev.body + ` {{${varName}}}` }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Email Templates Library</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Reusable, variable-ready email templates for outreach campaigns</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          + Create New Template
        </button>
      </div>

      {/* Category Tabs & Search */}
      <div className="card flex flex-col gap-4" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                background: selectedCategory === cat ? '#2563eb' : '#f1f5f9',
                color: selectedCategory === cat ? 'white' : '#475569',
                border: 'none', cursor: 'pointer'
              }}
            >
              {cat === 'Favorites' ? '⭐ Favorites' : cat}
            </button>
          ))}
        </div>

        <div className="header-search" style={{ maxWidth: '360px' }}>
          <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search templates by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="card flex flex-col justify-between" style={{ minHeight: '260px', position: 'relative' }}>
            <div>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-blue">{t.category}</span>
                <button
                  onClick={() => toggleFavorite(t)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  title="Toggle Favorite"
                >
                  {t.isFavorite ? '⭐' : '☆'}
                </button>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{t.name}</h3>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', marginBottom: '8px' }}>
                Subject: {t.subject}
              </div>

              <div style={{
                fontSize: '12px', color: '#64748b', lineHeight: '1.5',
                maxHeight: '70px', overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
              }}>
                {t.body}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Used {t.useCount} times</span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Edit
                </button>
                <Link
                  href={`/compose?templateId=${t.id}`}
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Use Template
                </Link>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-3 card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No templates found in this category. Click <strong>"+ Create New Template"</strong> to add one!
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Template Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Re-engagement">Re-engagement</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Default Subject Line *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', color: '#64748b' }}>Insert Variables</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['client_name', 'company', 'industry', 'requirement', 'sender_company'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      style={{
                        padding: '3px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                        borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                      }}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Body Content *</label>
                <textarea
                  className="form-input"
                  rows={8}
                  required
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTemplate ? 'Save Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
