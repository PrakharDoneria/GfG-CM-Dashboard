'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import './submissions.css';

export default function SubmissionsPage() {
  const fetchSubmissionsData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from('submissions')
      .select(`
        *,
        tasks (
          title,
          points_value
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return data || [];
  };

  const { data, loading } = useCachedData('user_submissions_cache', fetchSubmissionsData);
  const submissions = data || [];

  if (loading && !data) return <div className="loading-screen">Loading submissions...</div>;

  const approved = submissions.filter(s => s.status === 'approved');
  const pending = submissions.filter(s => s.status === 'pending');
  const totalPoints = approved.reduce((acc, s) => acc + (s.points_awarded || s.tasks?.points_value || 0), 0);
  const approvalRate = submissions.length > 0 ? Math.round((approved.length / submissions.length) * 100) : 0;

  return (
    <div className="submissions-container">
      <h1 className="page-title">My Submissions</h1>

      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-icon" style={{color: '#10b981'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="summary-info">
            <span className="summary-label">Approved</span>
            <span className="summary-value success">{approved.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{color: '#f59e0b'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div className="summary-info">
            <span className="summary-label">Pending Review</span>
            <span className="summary-value warning">{pending.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{color: 'var(--primary)'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <div className="summary-info">
            <span className="summary-label">Points Earned</span>
            <span className="summary-value primary">{totalPoints}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{color: '#3b82f6'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <div className="summary-info">
            <span className="summary-label">Approval Rate</span>
            <span className="summary-value">{approvalRate}%</span>
          </div>
        </div>
      </div>

      <div className="history-section card">
        <h2>Submission History</h2>
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Submitted On</th>
                <th>Proof</th>
                <th>Status</th>
                <th>Points</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length > 0 ? submissions.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="task-cell">
                      <strong>{s.tasks?.title}</strong>
                      <span className="task-id">ID: {s.id.slice(0,8)}</span>
                    </div>
                  </td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <a href={s.proof_url} target="_blank" rel="noreferrer" className="proof-link">
                      View {s.proof_type}
                    </a>
                  </td>
                  <td>
                    <span className={`status-pill ${s.status}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>{s.status === 'approved' ? `+${s.points_awarded || s.tasks?.points_value}` : '--'}</td>
                  <td className="feedback-cell">{s.feedback || (s.status === 'approved' ? 'Accepted, Good Job!' : '--')}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="empty-row">No submissions found. Start by completing some tasks!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
