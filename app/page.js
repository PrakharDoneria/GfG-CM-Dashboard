'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const isAdmin = session.user.email.endsWith('@geeksforgeeks.org');
        localStorage.setItem('user_role', isAdmin ? 'admin' : 'cm');
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
