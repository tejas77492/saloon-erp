'use client';

import { useState, useEffect, useCallback } from 'react';
import { servicesApi, availabilityApi, bookingsApi } from '@/lib/api';
import { formatCurrency, formatDuration, formatTime, formatDate, CATEGORY_ICONS, getTodayString, getMinBookingDate, getMaxBookingDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Service, Slot } from '@/types';
import Link from 'next/link';

// ─── Steps ───────────────────────────────────────────────────────────────────
type Step = 'services' | 'datetime' | 'details' | 'confirm';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'services', label: 'Services',  icon: '✂️' },
  { id: 'datetime', label: 'Date & Time', icon: '📅' },
  { id: 'details',  label: 'Your Info',  icon: '👤' },
  { id: 'confirm',  label: 'Confirm',    icon: '✅' },
];

export default function BookingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [step, setStep]             = useState<Step>('services');
  const [services, setServices]     = useState<Service[]>([]);
  const [selected, setSelected]     = useState<Service[]>([]);
  const [date, setDate]             = useState(getTodayString());
  const [slots, setSlots]           = useState<Slot[]>([]);
  const [selectedSlot, setSlot]     = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [formData, setFormData]     = useState({ name: '', phone: '', email: '', notes: '' });
  const [booking, setBooking]       = useState<null | { _id: string; date: string; startTime: string; endTime: string; totalPrice: number }>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Auto-fill user details when authenticated
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const totalDuration = selected.reduce((s, sv) => s + sv.duration + (sv.bufferTime || 0), 0);
  const totalPrice    = selected.reduce((s, sv) => s + sv.price, 0);

  useEffect(() => {
    servicesApi.getAll(true).then(r => setServices(r.data.data));
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!date || totalDuration === 0) return;
    setSlotsLoading(true);
    setSlot('');
    try {
      const r = await availabilityApi.get(date, totalDuration);
      setSlots(r.data.data);
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [date, totalDuration]);

  useEffect(() => {
    if (step === 'datetime') fetchSlots();
  }, [step, fetchSlots]);

  const toggleService = (svc: Service) => {
    setSelected(prev =>
      prev.find(s => s._id === svc._id)
        ? prev.filter(s => s._id !== svc._id)
        : [...prev, svc]
    );
  };

  const handleBook = async () => {
    setLoading(true); setError('');
    try {
      const res = await bookingsApi.create({
        customerName:  formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        notes:         formData.notes,
        services:      selected.map(s => s._id),
        date,
        startTime:     selectedSlot,
      });
      setBooking(res.data.data);
      setStep('confirm');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  const resetAll = () => {
    setStep('services'); setSelected([]); setDate(getTodayString());
    setSlot(''); setBooking(null); setFormData({ name:'', phone:'', email:'', notes:'' });
  };

  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Hero Nav ── */}
      <header className="site-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✂️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Salon<span className="gradient-text">ERP</span></div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Premium Grooming</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' ? (
                <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">🛠 Dashboard</Link>
              ) : (
                <Link href="/my-bookings" className="btn btn-ghost btn-sm">📋 My Bookings</Link>
              )}
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>👤 {user?.name}</span>
              <button onClick={logout} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary btn-sm">Login / Register</Link>
              <Link href="/login" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>🛠 Admin</Link>
            </>
          )}
        </div>
      </header>

      <main className="booking-main">
        {/* ── Hero ── */}
        {step === 'services' && (
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="fade-in">
            <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>💇</div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Book Your <span className="gradient-text">Perfect Look</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '1rem' }}>
              Choose your services, pick a time, and we'll take care of the rest.
            </p>
          </div>
        )}

        {/* ── Stepper ── */}
        {step !== 'confirm' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.35rem 0.9rem', borderRadius: 99,
                  fontSize: '0.82rem', fontWeight: 600,
                  background: i <= stepIndex ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'var(--card)',
                  color: i <= stepIndex ? '#1a1208' : 'var(--text-muted)',
                  border: `1px solid ${i <= stepIndex ? 'var(--accent)' : 'var(--card-border)'}`,
                  transition: 'all 0.3s',
                }}>
                  <span>{s.icon}</span><span>{s.label}</span>
                </div>
                {i < 2 && <div style={{ width: 24, height: 1, background: i < stepIndex ? 'var(--accent)' : 'var(--card-border)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* ─────────── STEP 1: SERVICES ─────────── */}
        {step === 'services' && (
          <div className="fade-in">
            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                Loading services...
              </div>
            ) : (
              <div className="service-grid">
                {services.map(svc => {
                  const isSelected = !!selected.find(s => s._id === svc._id);
                  return (
                    <div key={svc._id} onClick={() => toggleService(svc)}
                      style={{
                        padding: '1.25rem', borderRadius: 'var(--radius)', cursor: 'pointer',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                        background: isSelected ? 'rgba(201,168,124,0.08)' : 'var(--card)',
                        boxShadow: isSelected ? '0 0 20px var(--accent-glow)' : 'none',
                        transition: 'all 0.25s ease', position: 'relative',
                      }}>
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#1a1208', fontWeight: 800 }}>✓</div>
                      )}
                      <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{CATEGORY_ICONS[svc.category]}</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{svc.name}</div>
                      {svc.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{svc.description}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-2)', fontSize: '1.05rem' }}>{formatCurrency(svc.price)}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-3)', padding: '2px 10px', borderRadius: 99 }}>⏱ {formatDuration(svc.duration)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selected.length > 0 && (
              <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(201,168,124,0.06)', border: '1px solid rgba(201,168,124,0.2)', borderRadius: 'var(--radius)' }} className="fade-in">
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-2)' }}>Selected Services</div>
                {selected.map(s => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    <span>{s.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(s.price)} · {formatDuration(s.duration)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(201,168,124,0.2)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent-2)' }}>{formatCurrency(totalPrice)} · {formatDuration(totalDuration)}</span>
                </div>
                <button onClick={() => setStep('datetime')} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>
                  Choose Date & Time →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─────────── STEP 2: DATE & TIME ─────────── */}
        {step === 'datetime' && (
          <div className="fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Select Date</label>
              <input type="date" className="input" value={date}
                min={getMinBookingDate()} max={getMaxBookingDate()}
                onChange={e => setDate(e.target.value)}
                style={{ maxWidth: 260, fontSize: '1rem' }}
              />
              {date && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{formatDate(date)}</p>}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <label className="label" style={{ margin: 0 }}>Select Time Slot</label>
                <button onClick={fetchSlots} style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>↻ Refresh</button>
              </div>
              {slotsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : slots.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--card-border)' }}>
                  😔 No slots available for this date. Try another day.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {[['slot-available','Available'],['slot-booked','Booked'],['slot-blocked','Blocked']].map(([cls, label]) => (
                      <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span className={`slot-btn ${cls}`} style={{ padding: '2px 8px', minWidth: 'auto', pointerEvents: 'none', fontSize: '0.7rem' }}>●</span>{label}
                      </span>
                    ))}
                  </div>
                  <div className="slot-grid">
                    {slots.map(slot => (
                      <button key={slot.time}
                        disabled={slot.status !== 'available'}
                        onClick={() => setSlot(slot.time)}
                        className={`slot-btn slot-${slot.status} ${selectedSlot === slot.time ? 'selected' : ''}`}
                      >
                        {formatTime(slot.time)}
                        {slot.status === 'booked'   && ' ❌'}
                        {slot.status === 'blocked'  && ' 🚫'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              {!isAuthenticated && selectedSlot && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(201,168,124,0.06)', border: '1px solid rgba(201,168,124,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>🔒 Please sign in to complete your booking</span>
                  <Link href="/login" className="btn btn-primary btn-sm">Login / Register</Link>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep('services')} className="btn btn-ghost">← Back</button>
                <button disabled={!selectedSlot || !isAuthenticated} onClick={() => setStep('details')} className="btn btn-primary" style={{ flex: 1 }}>
                  {isAuthenticated ? `Continue → ${selectedSlot ? `(${formatTime(selectedSlot)})` : ''}` : '🔒 Login Required'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────── STEP 3: DETAILS ─────────── */}
        {step === 'details' && (
          <div className="fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="section-title">Your Information</h2>
              <p className="section-subtitle">We need a few details to confirm your booking.</p>
            </div>

            {/* Summary card */}
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(201,168,124,0.06)', border: '1px solid rgba(201,168,124,0.15)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.88rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>📅 </span>{formatDate(date)}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>🕐 </span>{formatTime(selectedSlot)}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>⏱ </span>{formatDuration(totalDuration)}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>💰 </span>{formatCurrency(totalPrice)}</div>
            </div>

            <div className="form-grid-2">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Your full name" value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input className="input" type="tel" placeholder="+91 98765 43210" value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email (Optional)</label>
                <input className="input" type="email" placeholder="email@example.com" value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea className="input" rows={3} placeholder="Any special requests..." value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.88rem' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep('datetime')} className="btn btn-ghost">← Back</button>
              <button
                disabled={!formData.name || !formData.phone || loading}
                onClick={handleBook}
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
              >
                {loading ? <><span className="spinner" /> Booking...</> : '🎉 Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* ─────────── STEP 4: CONFIRM ─────────── */}
        {step === 'confirm' && booking && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'fadeIn 0.5s ease' }}>🎉</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Booking <span className="gradient-text">Confirmed!</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>See you soon! Here's your booking summary.</p>

            <div className="glass" style={{ padding: '1.5rem', textAlign: 'left', maxWidth: 400, margin: '0 auto 2rem' }}>
              {[
                ['🔖 Booking ID', `#${booking._id.slice(-6).toUpperCase()}`],
                ['📅 Date',       formatDate(booking.date)],
                ['🕐 Time',       `${formatTime(booking.startTime)} → ${formatTime(booking.endTime)}`],
                ['💰 Total',      formatCurrency(booking.totalPrice)],
                ['📋 Services',   selected.map(s => s.name).join(', ')],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--card-border)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>📊 Status</span>
                <span className="badge badge-pending">Pending</span>
              </div>
            </div>

            <button onClick={resetAll} className="btn btn-primary btn-lg">
              + Book Another Appointment
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      {step !== 'confirm' && (
        <footer style={{ borderTop: '1px solid var(--card-border)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '3rem' }}>
          <span className="gradient-text" style={{ fontWeight: 700 }}>SalonERP</span> · Premium Salon Management
        </footer>
      )}
    </div>
  );
}
