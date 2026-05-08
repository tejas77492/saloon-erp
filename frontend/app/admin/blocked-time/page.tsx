'use client';

import { useEffect, useState } from 'react';
import { blockedTimeApi } from '@/lib/api';
import { DAY_NAMES, formatDate, formatTime } from '@/lib/utils';
import type { BlockedTime } from '@/types';

const EMPTY = { date: '', startTime: '', endTime: '', reason: '', isFullDay: false, recurringEnabled: false, recurringDays: [] as number[] };

export default function BlockedTimePage() {
  const [blocks, setBlocks]   = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await blockedTimeApi.getAll(); setBlocks(r.data.data); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleDay = (d: number) => {
    setForm(p => ({
      ...p,
      recurringDays: p.recurringDays.includes(d) ? p.recurringDays.filter(x => x !== d) : [...p.recurringDays, d],
    }));
  };

  const handleSave = async () => {
    if (!form.recurringEnabled && !form.date) { setError('Please pick a date or enable recurring.'); return; }
    setSaving(true); setError('');
    try {
      await blockedTimeApi.create({
        date:      form.recurringEnabled ? undefined : form.date,
        startTime: form.isFullDay ? undefined : form.startTime,
        endTime:   form.isFullDay ? undefined : form.endTime,
        reason:    form.reason,
        isFullDay: form.isFullDay,
        recurring: { enabled: form.recurringEnabled, days: form.recurringDays },
      });
      setShowForm(false); setForm({ ...EMPTY }); load();
    } catch(e: any) { setError(e.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this block?')) return;
    await blockedTimeApi.delete(id); load();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">Block Time</h1>
          <p className="section-subtitle">Close the salon or block specific time ranges.</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ ...EMPTY }); setError(''); }} className="btn btn-primary">
          + Add Block
        </button>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
          <div className="glass fade-in" style={{ width: '100%', maxWidth: 500, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.15rem' }}>🚫 Block Time</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Reason */}
              <div>
                <label className="label">Reason</label>
                <input className="input" placeholder="e.g. Lunch Break, Holiday, Emergency" value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </div>

              {/* Recurring toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: 42, height: 24 }}>
                  <input type="checkbox" checked={form.recurringEnabled}
                    onChange={e => setForm(p => ({ ...p, recurringEnabled: e.target.checked }))}
                    style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
                  <div style={{ width: 42, height: 24, borderRadius: 99, background: form.recurringEnabled ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'var(--bg-3)', transition: 'background 0.2s', border: '1px solid var(--card-border)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.recurringEnabled ? 21 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Recurring weekly block</label>
              </div>

              {/* Recurring days */}
              {form.recurringEnabled && (
                <div>
                  <label className="label">Repeat on days</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {DAY_NAMES.map((name, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        style={{
                          padding: '0.3rem 0.7rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600,
                          border: `1px solid ${form.recurringDays.includes(i) ? 'var(--accent)' : 'var(--card-border)'}`,
                          background: form.recurringDays.includes(i) ? 'rgba(201,168,124,0.15)' : 'var(--card)',
                          color: form.recurringDays.includes(i) ? 'var(--accent-2)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                        {name.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* One-time date */}
              {!form.recurringEnabled && (
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ maxWidth: 220 }} />
                </div>
              )}

              {/* Full day toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: 42, height: 24 }}>
                  <input type="checkbox" checked={form.isFullDay}
                    onChange={e => setForm(p => ({ ...p, isFullDay: e.target.checked }))}
                    style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 1 }} />
                  <div style={{ width: 42, height: 24, borderRadius: 99, background: form.isFullDay ? 'rgba(248,113,113,0.5)' : 'var(--bg-3)', transition: 'background 0.2s', border: '1px solid var(--card-border)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.isFullDay ? 21 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Block entire day</label>
              </div>

              {/* Time range */}
              {!form.isFullDay && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input" value={form.startTime}
                      onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input" value={form.endTime}
                      onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.88rem' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
                {saving ? <><span className="spinner" /> Saving...</> : '🚫 Add Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Blocks List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : blocks.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕊️</div>
          <p style={{ color: 'var(--text-muted)' }}>No blocked times. Your calendar is fully open!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {blocks.map(b => (
            <div key={b._id} className="glass" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>{b.isFullDay ? '🔴' : b.recurring?.enabled ? '🔁' : '⏰'}</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{b.reason || 'No reason specified'}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {b.recurring?.enabled
                      ? `Every ${b.recurring.days.map((d: number) => DAY_NAMES[d].slice(0, 3)).join(', ')}`
                      : b.date ? formatDate(b.date) : 'No date'
                    }
                    {' · '}
                    {b.isFullDay ? 'Full Day' : (b.startTime && b.endTime ? `${formatTime(b.startTime)} – ${formatTime(b.endTime)}` : 'All hours')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {b.recurring?.enabled && <span className="badge badge-confirmed">Recurring</span>}
                {b.isFullDay       && <span className="badge badge-cancelled">Full Day</span>}
                <button onClick={() => handleDelete(b._id)} className="btn btn-danger btn-sm">🗑 Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
