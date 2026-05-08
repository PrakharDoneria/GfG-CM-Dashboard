'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import { syncAllProfiles } from '@/lib/gfgSync';
import '@/app/(dashboard)/dashboard/overview.css';

export default function AdminDashboard() {
  const fetchAdminStats = async () => {
    // Total CMs
    const { count: cmCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cm');

    // Pending Reviews
    const { count: reviewCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Active Tasks
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gt('due_date', new Date().toISOString());

    // Total Points (Sum)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('points');
    
    const points = profiles?.reduce((acc, p) => acc + (p.points || 0), 0) || 0;

    return {
      totalCMs: cmCount || 0,
      pendingReviews: reviewCount || 0,
      activeTasks: taskCount || 0,
      totalPointsGiven: points
    };
  };

  const { data: statsData, loading } = useCachedData('admin_dashboard_cache', fetchAdminStats);

  const stats = statsData || {
    totalCMs: 0,
    pendingReviews: 0,
    activeTasks: 0,
    totalPointsGiven: 0
  };

  if (loading && !statsData) return <div className="loading-screen">Loading Admin Overview...</div>;

  return (
    <div className="overview-container">
      <div className="welcome-banner animate-fade-in" style={{background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)'}}>
        <div className="user-profile-info">
          <div className="user-avatar-large" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#10b981'}}>
            AD
          </div>
          <div className="welcome-text">
            <h1>Admin Control Center 🛠️</h1>
            <div className="college-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>GeeksforGeeks Administrative Access</span>
            </div>
            <div className="user-meta-pills">
              <span className="meta-pill active">System Admin</span>
              <span className="meta-pill">Live Mode</span>
            </div>
          </div>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-item">
            <span className="value">{(stats.totalCMs || 0).toLocaleString()}</span>
            <span className="label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{marginRight: '4px'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              Total CMs
            </span>
          </div>
          <div className="banner-stat-item">
            <span className="value">{(stats.totalPointsGiven || 0).toLocaleString()}</span>
            <span className="label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{marginRight: '4px'}}><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              Points Awarded
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-stats-row">
        <div className="overview-stat-card">
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="stat-content">
            <span className="label">Campus Mantris</span>
            <span className="value">{stats.totalCMs}</span>
            <span className="subtext">Registered participants</span>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-icon-wrapper" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="stat-content">
            <span className="label">Pending Reviews</span>
            <span className="value">{stats.pendingReviews}</span>
            <span className="subtext">Submissions to verify</span>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-icon-wrapper" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div className="stat-content">
            <span className="label">Active Tasks</span>
            <span className="value">{stats.activeTasks}</span>
            <span className="subtext">Currently live tasks</span>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-icon-wrapper" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <div className="stat-content">
            <span className="label">Total Distributed</span>
            <span className="value">{(stats.totalPointsGiven || 0).toLocaleString()}</span>
            <span className="subtext">Points earned by CMs</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            Quick Management
          </h2>
          <p className="subtext" style={{marginTop: '8px', marginBottom: '24px'}}>Take immediate actions on tasks and user submissions.</p>
          <div className="action-btns" style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
            <a href="/admin/tasks" className="btn-primary" style={{flex: 1}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create Task
            </a>
            <a href="/admin/review" className="btn-secondary" style={{flex: 1}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Review
            </a>
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style="margin-right: 8px; animation: rotate-slow 1s linear infinite"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg> Syncing...';
                await syncAllProfiles();
                window.location.reload();
              }}
              className="btn-primary-outline" 
              style={{flex: '1 1 100%', marginTop: '8px'}}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
              Sync All GfG Profiles
            </button>
          </div>
        </div>
        
        <div className="card">
          <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z"></path><path d="M10 12h.01"></path><path d="M13 18l-2-4"></path><path d="M13 6l-2 4"></path></svg>
            Communication
          </h2>
          <p className="subtext" style={{marginTop: '8px', marginBottom: '24px'}}>Broadcast important updates and notifications to all Campus Mantris.</p>
          <a href="/admin/announcements" className="text-btn" style={{fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'}}>
            Manage Announcements 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
