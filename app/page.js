'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, safeGetSession } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/authRoles';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    const checkUser = async () => {
      // 1. Quick check for cached role
      const cachedRole = localStorage.getItem('user_role');
      if (cachedRole) {
        router.replace(cachedRole === 'admin' ? '/admin/dashboard' : '/dashboard');
        return;
      }

      // 2. Fallback to actual session check
      const { session } = await safeGetSession();
      if (session) {
        const isAdmin = isAdminEmail(session.user.email);
        localStorage.setItem('user_role', isAdmin ? 'admin' : 'cm');

        if (isAdmin) {
          await supabase
            .from('profiles')
            .update({ role: 'admin', points: 0 })
            .eq('id', session.user.id);
        }

        router.replace(isAdmin ? '/admin/dashboard' : '/dashboard');
      } else {
        router.replace('/login');
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Synchronizing session...</p>
    </div>
  );
}
