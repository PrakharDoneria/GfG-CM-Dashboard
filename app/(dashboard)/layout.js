'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
          <div className="header-user">
            <span className="welcome">Welcome back,</span>
            <span className="user-name">{profile?.full_name || user?.email}</span>
            {profile?.role === 'cm' && (
              <div className="user-points">
                <span>🏆</span>
                <span>{profile?.points || 0} Points</span>
              </div>
            )}
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
