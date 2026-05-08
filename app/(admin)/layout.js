'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import '../(dashboard)/dashboard.css';

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  if (loading) return <div className="loading-screen">Verifying Admin Access...</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-user">
            <span className="badge badge-high" style={{marginRight: '12px'}}>ADMIN PORTAL</span>
            <span className="welcome">Logged in as</span>
            <span className="user-name">System Administrator</span>
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
