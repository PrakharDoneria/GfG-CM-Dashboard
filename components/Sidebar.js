'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import './Sidebar.css';

export default function Sidebar({ role = 'cm' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('gfg_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const fetchBadgeCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (role === 'admin') {
        // Admin: count pending reviews
        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setBadgeCount(count || 0);
      } else {
        // CM: count pending tasks
        const { data: tasks } = await supabase.from('tasks').select('id');
        const { data: subs } = await supabase.from('submissions').select('task_id').eq('user_id', user.id);
        const submittedIds = new Set(subs?.map(s => s.task_id) || []);
        const pendingCount = tasks?.filter(t => !submittedIds.has(t.id)).length || 0;
        setBadgeCount(pendingCount);
      }
    };

    fetchBadgeCount();

    // Listen for custom invalidation events to update badge counts instantly
    const handleInvalidation = () => fetchBadgeCount();
    window.addEventListener('cache-invalidated', handleInvalidation);

    // Refresh every 30 seconds
    const interval = setInterval(fetchBadgeCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cache-invalidated', handleInvalidation);
    };
  }, [role]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('gfg_theme', nextTheme);
  };

  const handleLogout = async () => {
    localStorage.removeItem('user_role');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const cmLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
    ) },
    { name: 'Pending Tasks', href: '/tasks', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
    ), badge: true },
    { name: 'Submissions', href: '/submissions', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
    ) },
    { name: 'Announcements', href: '/announcements', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z"></path><path d="M10 12h.01"></path><path d="M13 18l-2-4"></path><path d="M13 6l-2 4"></path></svg>
    ) },
  ];

  const adminLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
    ) },
    { name: 'Manage Tasks', href: '/admin/tasks', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
    ) },
    { name: 'Manage CM', href: '/admin/cms', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    ) },
    { name: 'Review Submissions', href: '/admin/review', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>
    ), badge: true },
    { name: 'Announcements', href: '/admin/announcements', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z"></path><path d="M10 12h.01"></path><path d="M13 18l-2-4"></path><path d="M13 6l-2 4"></path></svg>
    ) },
  ];

  const links = role === 'admin' ? adminLinks : cmLinks;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="GFG" />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Campus Mantri</span>
            <span className="sidebar-logo-sub">GeeksforGeeks</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-text">{link.name}</span>
              {link.badge && badgeCount > 0 && <span className="nav-badge">{badgeCount}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle dark mode">
            <span className="nav-icon">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </span>
            <span className="nav-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="mobile-logo">
          <img src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="GFG" />
          <span>CM Dashboard</span>
        </div>
        <div className="mobile-topbar-actions">
          <button className="mobile-theme-btn" onClick={toggleTheme} title="Toggle dark mode">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
          <button className="mobile-logout-btn" onClick={handleLogout} title="Sign Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`mobile-nav-item ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">
              {link.icon}
              {link.badge && badgeCount > 0 && <span className="mobile-badge">{badgeCount}</span>}
            </span>
            <span className="mobile-nav-label">{link.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
