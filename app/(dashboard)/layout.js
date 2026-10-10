'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, safeGetUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { user } = await safeGetUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profile);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) return <div className="loading-screen">Loading Dashboard...</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar role={profile?.role} />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="header-breadcrumb">SoftBridge Labs Campus Lead</span>
            <span className="header-page-name">Dashboard</span>
          </div>
          <div className="header-right">
            {profile?.role === 'cm' && (
              <div className="user-points">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                </span>
                <span>{profile?.points || 0} pts</span>
              </div>
            )}
            <div className="header-user">
              <div className="header-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {(profile?.full_name || user?.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="welcome">Welcome back</div>
                <div className="user-name">{profile?.full_name || user?.email?.split('@')[0] || 'Member'}</div>
              </div>
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
