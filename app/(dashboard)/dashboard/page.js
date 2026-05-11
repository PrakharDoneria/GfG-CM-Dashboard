'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import GfGIntegration from '@/components/GfGIntegration';
import './overview.css';

export default function UserDashboard() {
  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: tasks } = await supabase.from('tasks').select('id');
    const { data: subs } = await supabase
      .from('submissions')
      .select('task_id')
      .eq('user_id', user.id);
    
    const submittedIds = new Set(subs.map(s => s.task_id));
    const pendingCount = tasks.filter(t => !submittedIds.has(t.id)).length;

    // Fetch announcements
    const { data: ann } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      profile,
      stats: {
        pendingTasks: pendingCount,
        totalSubmissions: subs.length,
        pointsEarned: profile?.points || 0,
        progress: tasks.length > 0 ? Math.round((subs.length / tasks.length) * 100) : 0,
        totalTasks: tasks.length
      },
      announcements: ann || []
    };
  };

  const { data, loading } = useCachedData('user_dashboard_cache', fetchDashboardData);

  const profile = data?.profile || {};
  const stats = data?.stats || {
    pendingTasks: 0,
    totalSubmissions: 0,
    pointsEarned: 0,
    progress: 0,
    totalTasks: 0
  };
  const announcements = data?.announcements || [];
  const latestAnnouncement = announcements[0];

  if (loading && !data) return <div className="loading-screen">Loading statistics...</div>;

  return (
    <div className="overview-container">
      {latestAnnouncement && (
        <div className="announcement-toast animate-fade-in">
          <div className="toast-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div className="toast-body">
            <div className="toast-title">
              {latestAnnouncement.title}
              <span className="toast-new-badge">New</span>
            </div>
            <p className="toast-text">{latestAnnouncement.body}</p>
            <span className="toast-date">Posted on {new Date(latestAnnouncement.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      <div className="welcome-banner animate-fade-in">
        <div className="user-profile-info">
          <div className="user-avatar-large">
            {profile.full_name?.split(' ').map(n => n[0]).join('') || 'CM'}
          </div>
          <div className="welcome-text">
            <h1>Welcome, {profile.full_name?.split(' ')[0] || 'User'}! 👋</h1>
            <div className="college-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              <span>{profile.college_name || 'Your College Name'}</span>
            </div>
            <div className="user-meta-pills">
              <span className="meta-pill">@{profile.full_name?.toLowerCase().replace(' ', '') || 'username'}</span>
              <span className="meta-pill active">Active Member</span>
              <span className="meta-pill">Joined {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-item">
            <span className="value">{(stats.totalSubmissions || 0).toLocaleString()}</span>
            <span className="label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{marginRight: '4px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Tasks Done
            </span>
          </div>
          <div className="banner-stat-item">
            <span className="value">{(stats.pointsEarned || 0).toLocaleString()}</span>
            <span className="label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{marginRight: '4px'}}><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              Points
            </span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-stats-row layout-2-plus-1">
        <div className="overview-stat-card">
          <div className="stat-icon-wrapper" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="stat-content">
            <span className="label">Pending Tasks</span>
            <span className="value">{stats.pendingTasks}</span>
            <span className="subtext">Yet to be submitted</span>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-icon-wrapper" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
          </div>
          <div className="stat-content">
            <span className="label">Submissions</span>
            <span className="value">{stats.totalSubmissions}</span>
            <span className="subtext">Your total submissions</span>
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-icon-wrapper" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <div className="stat-content">
            <span className="label">Points Earned</span>
            <span className="value">{(stats.pointsEarned || 0).toLocaleString()}</span>
            <span className="subtext">From approved tasks</span>
          </div>
        </div>
      </div>

      <div className="usp-banner animate-fade-in">
        <div className="usp-badge">🔥 PLATFORM USP</div>
        <GfGIntegration profile={profile} onSyncSuccess={() => {
           // Refresh data to show new points
           window.location.reload(); 
        }} />
      </div>

      <div className="progress-section card">
        <div className="progress-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 11 3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            Overall Progress
          </h2>
          <span className="tasks-count-pill">{stats.totalSubmissions}/{stats.totalTasks} tasks</span>
        </div>
        <div className="main-progress-container">
          <div className="main-progress-bar" style={{ width: `${stats.progress}%` }}></div>
        </div>
        <div className="progress-footer">
          <span>{stats.totalSubmissions} submitted</span>
          <span className="percentage">{stats.progress}% complete</span>
        </div>
      </div>

      {announcements.length > 1 && (
        <div className="recent-announcements card" style={{padding: '28px'}}>
          <h2 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z"></path></svg>
            Recent Updates
          </h2>
          <div className="announcements-list" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {announcements.slice(1).map(a => (
              <div key={a.id} className="announcement-item" style={{paddingBottom: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px'}}>
                <div className="announcement-icon-mini" style={{width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z"></path></svg>
                </div>
                <div className="announcement-content">
                  <h4 style={{color: 'var(--primary)', marginBottom: '4px', fontSize: '0.95rem'}}>{a.title}</h4>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4'}}>{a.body}</p>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block'}}>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
