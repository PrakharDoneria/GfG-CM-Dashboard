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
            <span className="header-breadcrumb">GfG Campus Mantri</span>
            <span className="header-page-name">Dashboard</span>
          </div>
          <div className="header-right">
            {profile?.role === 'cm' && (
              <div className="user-points">
                <span>🏆</span>
                <span>{profile?.points || 0} pts</span>
              </div>
            )}
            <div className="header-user">
              <div className="header-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {profile?.gfg_profile_img ? (
                  <img src={profile.gfg_profile_img} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (profile?.full_name || user?.email || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                )}
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
