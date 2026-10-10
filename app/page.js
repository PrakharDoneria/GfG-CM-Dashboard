'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeGetSession } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/authRoles';
import './landing.css';

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { session } = await safeGetSession();
      setSession(session);
      setLoaded(true);
    };
    checkUser();
  }, []);

  const handleAction = () => {
    if (session) {
      const isAdmin = isAdminEmail(session.user.email);
      router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="landing-container">

      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <strong>SoftBridge</strong> Labs
        </div>
        <div className="nav-links">
          <a href="#">About</a>
          <a href="#">Services</a>
          <a href="#">Products</a>
          <a href="#">Workspace</a>
          <a href="#">Dev Tools</a>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
        </div>
        <div className="nav-actions">
          <button className="nav-btn" onClick={handleAction}>
            {loaded ? (session ? 'Dashboard' : 'Get Started') : 'Get Started'}
          </button>
          <div className="nav-menu-icon">
            {/* Bento-grid icon matching the screenshot */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="landing-main">
        {/* Background Video */}
        <div className="video-background">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/assets/backgrounds/home.jpg"
          >
            <source src="/assets/backgrounds/home.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay" />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            Engineering the&nbsp;<br />
            <span className="text-blue">Bridge</span>
          </h1>

          <p className="hero-subtitle">
            Next-gen software and immersive AI experiences — built in India, used worldwide.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-dark" onClick={handleAction}>
              {/* Store icon */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Play Store
            </button>
            <button className="btn btn-white">All Products</button>
          </div>

          <div className="hero-stats">
            <span>10,000+ Downloads</span>
            <span className="dot">•</span>
            <span>190+ Countries</span>
            <span className="dot">•</span>
            <span>27+ Open Source Repos</span>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        Support: <a href="mailto:support@softbridgelabs.in">support@softbridgelabs.in</a>
      </footer>
    </div>
  );
}
