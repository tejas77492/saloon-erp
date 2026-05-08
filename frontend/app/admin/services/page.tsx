'use client';

import { useEffect, useState } from 'react';
import { servicesApi } from '@/lib/api';
import { formatCurrency, formatDuration, CATEGORY_ICONS } from '@/lib/utils';
import type { Service } from '@/types';

const CATEGORIES = ['hair', 'beard', 'skin', 'nails', 'other'] as const;
type Category = typeof CATEGORIES[number];
const EMPTY_FORM: { name: string; description: string; price: string; duration: string; category: Category; bufferTime: string; isActive: boolean } = { name: '', description: '', price: '', duration: '', category: 'hair', bufferTime: '0', isActive: true };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await servicesApi.getAll(); setServices(r.data.data); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setError(''); setShowForm(true); };
  const openEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description, price: String(s.price), duration: String(s.duration), category: s.category, bufferTime: String(s.bufferTime || 0), isActive: s.isActive });
    setEditId(s._id); setError(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration) { setError('Name, price and duration are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, price: Number(form.price), duration: Number(form.duration), bufferTime: Number(form.bufferTime) };
      if (editId) await servicesApi.update(editId, payload);
      else        await servicesApi.create(payload);
      setShowForm(false); load();
    } catch (e: any) { setError(e.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await servicesApi.delete(id); load();
  };

  const handleToggle = async (s: Service) => {
    await servicesApi.update(s._id, { isActive: !s.isActive }); load();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">Services</h1>
          <p className="section-subtitle">Manage your salon services, pricing and durations.</p>
        </div>
        <button onClick={openNew} className="btn btn-primary">+ Add Service</button>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
          <div className="glass fade-in" style={{ width: '100%', maxWidth: 500, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{editId ? '✏️ Edit Service' : '+ New Service'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Service Name *</label>
                <input className="input" placeholder="e.g. Haircut" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input className="input" type="number" min="0" placeholder="200" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Duration (min) *</label>
                  <input className="input" type="number" min="5" step="5" placeholder="30" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Buffer Time (min)</label>
                  <input className="input" type="number" min="0" step="5" placeholder="5" value={form.bufferTime} onChange={e => setForm(p => ({ ...p, bufferTime: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: 42, height: 24 }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
                  <div style={{ width: 42, height: 24, borderRadius: 99, background: form.isActive ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'var(--bg-3)', transition: 'background 0.2s', border: '1px solid var(--card-border)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.isActive ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
                <label style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>Active (visible to customers)</label>
              </div>
            </div>

            {error && <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.88rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
                {saving ? <><span className="spinner" /> Saving...</> : (editId ? '✓ Update Service' : '+ Create Service')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Services Table ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : services.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✂️</div>
          <p style={{ color: 'var(--text-muted)' }}>No services yet. Add your first service!</p>
          <button onClick={openNew} className="btn btn-primary" style={{ marginTop: '1rem' }}>+ Add Service</button>
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.description}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.88rem' }}>{CATEGORY_ICONS[s.category]} {s.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-2)' }}>{formatCurrency(s.price)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {formatDuration(s.duration)}
                      {s.bufferTime > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>+{s.bufferTime}m buffer</span>}
                    </td>
                    <td>
                      <button onClick={() => handleToggle(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className={`badge ${s.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(s)} className="btn btn-ghost btn-sm">✏️ Edit</button>
                        <button onClick={() => handleDelete(s._id)} className="btn btn-danger btn-sm">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
