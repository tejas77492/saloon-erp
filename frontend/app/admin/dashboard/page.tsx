'use client';

import { useEffect, useState } from 'react';
import { bookingsApi } from '@/lib/api';
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/lib/utils';
import type { DashboardStats, Booking } from '@/types';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending:   { label: 'Pending',   badge: 'badge-pending' },
  confirmed: { label: 'Confirmed', badge: 'badge-confirmed' },
  completed: { label: 'Completed', badge: 'badge-completed' },
  cancelled: { label: 'Cancelled', badge: 'badge-cancelled' },
};

export default function DashboardPage() {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const r = await bookingsApi.getStats();
      setStats(r.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStats(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: '📅', label: "Today's Bookings",  value: stats?.todayCount ?? 0,    color: 'var(--info)',    fmt: (v: number) => v },
    { icon: '💰', label: "Today's Revenue",   value: stats?.todayRevenue ?? 0,  color: 'var(--success)', fmt: formatCurrency },
    { icon: '📊', label: 'Total Bookings',    value: stats?.totalBookings ?? 0, color: 'var(--accent)',  fmt: (v: number) => v },
    { icon: '💵', label: 'Total Revenue',     value: stats?.totalRevenue ?? 0,  color: 'var(--warning)', fmt: formatCurrency },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        {STAT_CARDS.map(card => (
          <div key={card.label} className="stat-card glass-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{card.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, letterSpacing: '-0.03em' }}>
                  {card.fmt(card.value)}
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', opacity: 0.7 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* ── Upcoming Bookings ── */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>📋 Upcoming Appointments</div>
            <Link href="/admin/bookings" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {stats?.upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No upcoming bookings</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.upcoming.slice(0, 5).map((b: Booking) => (
                <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{b.customerName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDate(b.date)} · {formatTime(b.startTime)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {b.services.map((s: any) => s.name).join(', ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${STATUS_CONFIG[b.status]?.badge}`}>{STATUS_CONFIG[b.status]?.label}</span>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-2)', marginTop: '0.25rem' }}>{formatCurrency(b.totalPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Top Services ── */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🏆 Top Services</div>
          {stats?.topServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {stats?.topServices.map((s, i) => (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600 }}>
                      <span style={{ color: 'var(--accent)', marginRight: '0.4rem' }}>#{i + 1}</span>{s.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{s.count} bookings</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                      width: `${Math.min(100, (s.count / (stats.topServices[0]?.count || 1)) * 100)}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
