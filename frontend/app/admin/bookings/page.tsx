'use client';

import { useEffect, useState } from 'react';
import { bookingsApi } from '@/lib/api';
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

const STATUSES: BookingStatus[] = ['confirmed', 'completed', 'cancelled'];
const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
};
const STATUS_BADGE: Record<BookingStatus, string> = {
  confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<BookingStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      if (dateFilter)       params.date   = dateFilter;
      const r = await bookingsApi.getAll(params);
      setBookings(r.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, dateFilter]);

  const updateStatus = async (id: string, status: BookingStatus, cancellationReason?: string) => {
    setUpdating(id);
    try { await bookingsApi.update(id, { status, cancellationReason }); load(); setSelected(null); }
    catch(e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const handleCancel = (id: string) => {
    const reason = prompt('Cancellation reason (optional):') || '';
    updateStatus(id, 'cancelled', reason);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Bookings</h1>
        <p className="section-subtitle">Manage all customer appointments.</p>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={{ maxWidth: 180 }} placeholder="Filter by date" />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['all', ...STATUSES] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {(dateFilter || filter !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFilter(''); setFilter('all'); }}>✕ Clear</button>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
          <div className="glass fade-in" style={{ width: '100%', maxWidth: 480, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Booking Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            {[
              ['👤 Customer',  selected.customerName],
              ['📞 Phone',     selected.customerPhone],
              ['📧 Email',     selected.customerEmail || '—'],
              ['📅 Date',      formatDate(selected.date)],
              ['🕐 Time',      `${formatTime(selected.startTime)} → ${formatTime(selected.endTime)}`],
              ['⏱ Duration',  formatDuration(selected.totalDuration)],
              ['💰 Total',     formatCurrency(selected.totalPrice)],
              ['✂️ Services',  selected.services.map((s: any) => s.name).join(', ')],
              ['📝 Notes',     selected.notes || '—'],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px solid var(--card-border)', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)', minWidth: 110 }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>📊 Status</span>
              <span className={`badge ${STATUS_BADGE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {selected.status === 'confirmed' && (
                <button onClick={() => updateStatus(selected._id, 'completed')}
                  disabled={!!updating} className="btn btn-success" style={{ flex: 1 }}>
                  {updating === selected._id ? <><span className="spinner" /> Updating...</> : '✓ Mark Completed'}
                </button>
              )}
              {selected.status === 'confirmed' && (
                <button onClick={() => handleCancel(selected._id)}
                  disabled={!!updating} className="btn btn-danger">Cancel Booking</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : bookings.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ color: 'var(--text-muted)' }}>No bookings found for the selected filters.</p>
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Services</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id} style={{ cursor: 'pointer' }} onClick={() => setSelected(b)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: 160 }}>
                      {b.services.map((s: any) => s.name).join(', ')}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{formatDate(b.date)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatTime(b.startTime)} – {formatTime(b.endTime)}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDuration(b.totalDuration)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-2)' }}>{formatCurrency(b.totalPrice)}</td>
                    <td><span className={`badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {b.status === 'confirmed' && (
                          <button onClick={() => updateStatus(b._id, 'completed')}
                            disabled={updating === b._id} className="btn btn-success btn-sm">
                            {updating === b._id ? '...' : '✓ Complete'}
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => handleCancel(b._id)}
                            disabled={updating === b._id} className="btn btn-danger btn-sm">Cancel</button>
                        )}
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
