'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, safeGetUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import '../(dashboard)/dashboard.css';

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { user } = await safeGetUser();
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
          <div className="header-left">
            <span className="header-breadcrumb">GeeksforGeeks</span>
            <span className="header-page-name">Admin Portal</span>
          </div>
          <div className="header-right">
            <span className="badge badge-high" style={{padding: '6px 14px', fontSize: '0.72rem'}}>ADMIN ACCESS</span>
            <div className="header-user" style={{cursor: 'default'}}>
              <div className="header-avatar" style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)'}}>AD</div>
              <div>
                <div className="welcome">Logged in as</div>
                <div className="user-name">System Administrator</div>
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
