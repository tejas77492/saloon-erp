'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { bookingsApi, notificationsApi } from '@/lib/api';
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/lib/utils';
import type { Booking, Notification } from '@/types';
import Link from 'next/link';

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function MyBookingsPage() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'bookings' | 'notifications'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, nRes] = await Promise.all([
        bookingsApi.getMy(),
        notificationsApi.getAll(),
      ]);
      setBookings(bRes.data.data);
      setNotifications(nRes.data.data);
      setUnreadCount(nRes.data.unreadCount || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => { logout(); router.push('/'); };

  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && b.date >= new Date().toISOString().split('T')[0]);
  const past = bookings.filter(b => b.status !== 'confirmed' || b.date < new Date().toISOString().split('T')[0]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header className="site-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✂️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text)' }}>Salon<span className="gradient-text">ERP</span></div>
            </div>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👤 {user?.name}</div>
          <Link href="/" className="btn btn-primary btn-sm">+ Book</Link>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
        </div>
      </header>

      <main className="booking-main" style={{ paddingTop: '2rem' }}>
        <div className="fade-in">
          {/* ── Page Title ── */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 className="section-title">My Appointments</h1>
            <p className="section-subtitle">View your bookings and notifications.</p>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--card-border)', maxWidth: 320 }}>
            {([
              { id: 'bookings' as const, label: '📋 Bookings' },
              { id: 'notifications' as const, label: `🔔 Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                  background: tab === t.id ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent',
                  color: tab === t.id ? '#1a1208' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : tab === 'bookings' ? (
            <>
              {/* ── Upcoming ── */}
              {upcoming.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-2)' }}>
                    📅 Upcoming ({upcoming.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {upcoming.map(b => (
                      <div key={b._id} className="glass glass-hover" style={{ padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{b.services.map((s: any) => s.name).join(', ')}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              <span>📅 {formatDate(b.date)}</span>
                              <span>🕐 {formatTime(b.startTime)} → {formatTime(b.endTime)}</span>
                              <span>⏱ {formatDuration(b.totalDuration)}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-2)', marginTop: '0.25rem' }}>{formatCurrency(b.totalPrice)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Past / All ── */}
              {past.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    📜 Past & Cancelled ({past.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {past.map(b => (
                      <div key={b._id} className="glass" style={{ padding: '1rem 1.25rem', opacity: b.status === 'cancelled' ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.2rem', fontSize: '0.92rem' }}>{b.services.map((s: any) => s.name).join(', ')}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {formatDate(b.date)} · {formatTime(b.startTime)}
                            </div>
                            {b.cancellationReason && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                ❌ {b.cancellationReason}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>{formatCurrency(b.totalPrice)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookings.length === 0 && (
                <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No bookings yet. Book your first appointment!</p>
                  <Link href="/" className="btn btn-primary">+ Book Now</Link>
                </div>
              )}
            </>
          ) : (
            /* ── Notifications Tab ── */
            <>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
                  ✓ Mark all as read
                </button>
              )}
              {notifications.length === 0 ? (
                <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                  <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {notifications.map(n => (
                    <div key={n._id} className="glass" style={{
                      padding: '1rem 1.25rem',
                      borderLeft: `3px solid ${n.type.includes('cancel') || n.type.includes('closed') ? 'var(--danger)' : n.type.includes('confirmed') ? 'var(--success)' : 'var(--info)'}`,
                      opacity: n.isRead ? 0.65 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
                            {!n.isRead && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginRight: '0.5rem' }} />}
                            {n.title}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                            {new Date(n.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
