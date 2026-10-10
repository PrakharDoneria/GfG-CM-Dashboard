'use client';
import { useState, useEffect } from 'react';
import { supabase, safeGetSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { isAdminEmail } from '@/lib/authRoles';
import './login.css';

const TICKER_TAGS = [
  'Task Tracking', 'Real-time Analytics', 'Leaderboard', 'Announcements',
  'Submission Reviews', 'Campus Goals', 'Progress Reports', 'Top Performers', 'Auto Sync',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { session } = await safeGetSession();
      if (session) {
        const isAdmin = isAdminEmail(session.user.email);
        const role = isAdmin ? 'admin' : 'cm';
        localStorage.setItem('user_role', role);
        if (isAdmin) {
          await supabase.from('profiles').update({ role: 'admin', points: 0 }).eq('id', session.user.id);
        }
        router.replace(isAdmin ? '/admin/dashboard' : '/dashboard');
      } else {
        localStorage.removeItem('user_role');
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const isAdmin = isAdminEmail(email);
      const role = isAdmin ? 'admin' : 'cm';
      localStorage.setItem('user_role', role);
      const updatePayload = { role };
      if (role === 'admin') updatePayload.points = 0;
      await supabase.from('profiles').update(updatePayload).eq('id', data.user.id);
      router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  const allTags = [...TICKER_TAGS, ...TICKER_TAGS];

  return (
    <div className="login-page">

      {/* ── LEFT BRANDING PANEL ── */}
      <aside className="login-brand-panel">
        {/* Background Video */}
        <div className="login-video-background">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/assets/backgrounds/app.jpg"
          >
            <source src="/assets/backgrounds/app.mp4" type="video/mp4" />
          </video>
          <div className="login-video-overlay" />
        </div>

        {/* Logo */}
        <div className="brand-header">
          <div className="brand-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="brand-logo-text">
            <strong>SoftBridge</strong> Labs
          </div>
        </div>

        {/* Hero copy */}
        <div className="brand-hero">
          <div className="brand-eyebrow">
            <span className="brand-eyebrow-dot" />
            Official Platform
          </div>
          <h1>
            Welcome to<br />
            <span className="highlight">SoftBridge Labs</span>
          </h1>
          <p>
            Track tasks, earn points, and stay on top of the leaderboard —
            all in one premium dashboard.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="brand-cards">
          <div className="brand-feat-card">
            <div className="brand-feat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h3>Task Management</h3>
              <p>Submit tasks, track deadlines, and earn points automatically.</p>
            </div>
          </div>
          <div className="brand-feat-card">
            <div className="brand-feat-icon brand-feat-icon--blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h3>Live Analytics</h3>
              <p>Real-time insights on your performance and leaderboard rank.</p>
            </div>
          </div>
        </div>

        {/* Scrolling ticker */}
        <div className="brand-ticker">
          <div className="brand-ticker-track">
            {allTags.map((tag, i) => (
              <span key={i} className="brand-ticker-tag">{tag}</span>
            ))}
          </div>
        </div>
      </aside>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="login-form-panel">
        <div className="login-card animate-fade-in">

          {/* Header */}
          <div className="login-header">
            <div className="login-brand-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              SoftBridge
            </div>
            <h1>Welcome back</h1>
            <p>Sign in to your Campus Lead account</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options row */}
            <div className="form-options">
              <label className="remember-me">
                <div className="switch">
                  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                  <span className="slider"></span>
                </div>
                <span>Remember me</span>
              </label>
            </div>

            {error && (
              <div className="error-message">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {loading && <p className="verifying-text">Verifying credentials...</p>}

          <div className="login-footer">
            <p className="made-by">Developed by SoftBridge Labs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
