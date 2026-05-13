'use client';
import { useState, useEffect } from 'react';
import { supabase, safeGetSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import './login.css';

// Ticker tags duplicated for seamless infinite scroll
const TICKER_TAGS = [
  '🚀 Task Tracking', '📊 Real-time Analytics', '🏆 Leaderboard', '📢 Announcements',
  '✅ Submission Reviews', '🎯 Campus Goals', '💡 GfG Integration', '📝 Progress Reports',
  '🌟 Top Performers', '🔄 Auto Sync',
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
        const isAdmin = session.user.email.endsWith('@geeksforgeeks.org');
        const role = isAdmin ? 'admin' : 'cm';
        localStorage.setItem('user_role', role);
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const isAdmin = email.endsWith('@geeksforgeeks.org');
      const role = isAdmin ? 'admin' : 'cm';
      localStorage.setItem('user_role', role);
      
      await supabase
        .from('profiles')
        .update({ role })
        .eq('id', data.user.id);

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

  const allTags = [...TICKER_TAGS, ...TICKER_TAGS]; // duplicate for seamless loop

  return (
    <div className="login-page">

      {/* ── LEFT BRANDING PANEL (desktop only) ── */}
      <aside className="login-brand-panel">
        <div className="brand-glow-bottom" />

        {/* Logo */}
        <div className="brand-header">
          <div className="brand-logo-box">
            <span>GfG</span>
          </div>
          <div className="brand-logo-text">
            <strong>Campus Mantri</strong>
            <span>GeeksforGeeks</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="brand-hero">
          <div className="brand-eyebrow">
            <span className="brand-eyebrow-dot"></span>
            Official Platform
          </div>
          <h1>
            Empower Your<br />
            Campus Journey<br />
            with <span className="highlight">GeeksforGeeks</span>
          </h1>
          <p>
            Track tasks, sync your GfG profile, earn points, and stay on top
            of the leaderboard — all in one premium dashboard built for Campus Mantris.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="brand-cards">
          <div className="brand-feat-card">
            <div className="brand-feat-icon" style={{ background: 'rgba(47,141,70,0.15)' }}>🎯</div>
            <h3>Task Management</h3>
            <p>Submit tasks, track deadlines, and earn points automatically.</p>
          </div>
          <div className="brand-feat-card">
            <div className="brand-feat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>⚡</div>
            <h3>GfG Sync</h3>
            <p>Live sync of your GeeksforGeeks coding stats and achievements.</p>
          </div>
        </div>

        {/* Scrolling tag ticker */}
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
          <div className="login-header">
            <div className="logo-wrapper">
              <img
                src="https://media.geeksforgeeks.org/gfg-gg-logo.svg"
                alt="GfG"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'block';
                }}
              />
              <span style={{ display: 'none' }}>GfG</span>
            </div>
            <h1>Welcome back 👋</h1>
            <p>Sign in to your Campus Mantri account</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
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
            <div className="form-group">
              <label>Password</label>
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
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <div className="switch">
                  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                  <span className="slider"></span>
                </div>
                <span>Remember Me</span>
              </label>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? <div className="loading-spinner-small"></div> : 'Sign In'}
            </button>
          </form>

          {loading && <p className="verifying-text">Verifying credentials...</p>}
          
          <div className="login-footer">
            <p className="made-by">Developed with 💚 by <a href="https://www.geeksforgeeks.org/" target="_blank" rel="noopener noreferrer">GeeksforGeeks Community Team</a></p>
          </div>
        </div>
      </div>

    </div>
  );
}
