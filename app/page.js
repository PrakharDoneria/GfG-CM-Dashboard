'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeGetSession } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/authRoles';
import './landing.css';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { session } = await safeGetSession();
      if (session) {
        const isAdmin = isAdminEmail(session.user.email);
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
      <div className="loading-text">Loading workspace...</div>
    </div>
  );
}
