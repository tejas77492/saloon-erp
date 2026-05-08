'use client';

import { useEffect, useState } from 'react';
import { workingHoursApi } from '@/lib/api';
import { DAY_NAMES } from '@/lib/utils';
import type { WorkingHours } from '@/types';

export default function SchedulePage() {
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    workingHoursApi.getAll()
      .then(r => setHours(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const update = (day: number, field: string, value: string | boolean) => {
    setHours(prev => prev.map(h =>
      h.day === day ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await workingHoursApi.update(
        hours.map(h => ({
          day: h.day,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: '1.5rem',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 className="section-title">Working Hours</h1>
          <p className="section-subtitle">
            Set your salon&apos;s opening and closing times.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
        >
          {saving
            ? <><span className="spinner" /> Saving...</>
            : saved
              ? '✓ Saved!'
              : '💾 Save Changes'}
        </button>
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        {hours.sort((a, b) => a.day - b.day).map((h, idx) => (
          <div key={h.day} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.5rem',
            borderBottom: idx < hours.length - 1
              ? '1px solid var(--card-border)'
              : 'none',
            flexWrap: 'wrap',
            opacity: h.isClosed ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}>
            {/* Day name */}
            <div style={{ minWidth: 110, fontWeight: 600, fontSize: '0.9rem' }}>
              {DAY_NAMES[h.day]}
            </div>

            {/* Closed toggle */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '0.5rem', minWidth: 110,
            }}>
              <label style={{
                position: 'relative', width: 42, height: 24,
                display: 'inline-block', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={!h.isClosed}
                  onChange={e => update(h.day, 'isClosed', !e.target.checked)}
                  style={{
                    opacity: 0, position: 'absolute',
                    inset: 0, cursor: 'pointer', zIndex: 1,
                  }}
                />
                <div style={{
                  width: 42, height: 24, borderRadius: 99,
                  background: !h.isClosed
                    ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
                    : 'var(--bg-3)',
                  transition: 'background 0.2s',
                  border: '1px solid var(--card-border)',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', position: 'absolute',
                    top: 3, left: !h.isClosed ? 21 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </label>
              <span style={{
                fontSize: '0.82rem',
                color: h.isClosed ? 'var(--danger)' : 'var(--success)',
                fontWeight: 600,
              }}>
                {h.isClosed ? 'Closed' : 'Open'}
              </span>
            </div>

            {/* Time inputs */}
            {!h.isClosed ? (
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '0.75rem', flexWrap: 'wrap',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{
                    fontSize: '0.82rem', color: 'var(--text-muted)',
                  }}>Opens</span>
                  <input
                    type="time"
                    className="input"
                    value={h.openTime}
                    style={{ width: 130 }}
                    onChange={e => update(h.day, 'openTime', e.target.value)}
                  />
                </div>
                <span style={{ color: 'var(--text-dim)' }}>→</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{
                    fontSize: '0.82rem', color: 'var(--text-muted)',
                  }}>Closes</span>
                  <input
                    type="time"
                    className="input"
                    value={h.closeTime}
                    style={{ width: 130 }}
                    onChange={e => update(h.day, 'closeTime', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '0.85rem', color: 'var(--text-dim)',
                fontStyle: 'italic',
              }}>
                Salon is closed all day
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '1rem', padding: '1rem',
        background: 'rgba(201,168,124,0.05)',
        border: '1px solid rgba(201,168,124,0.15)',
        borderRadius: 'var(--radius)',
        fontSize: '0.85rem', color: 'var(--text-muted)',
      }}>
        💡 <strong>Tip:</strong> Changes take effect immediately for
        new bookings. Existing bookings are not affected.
      </div>
    </div>
  );
}
