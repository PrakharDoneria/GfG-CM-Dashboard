'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import './GfGIntegration.css';

export default function GfGIntegration({ profile, onSyncSuccess }) {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const CUTOFF_DATE = new Date('2026-05-19T00:00:00Z');

  const fetchGfGData = async () => {
    if (!handle) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, requestType: '', year: '', month: '' })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setProfileData(data);
      } else {
        setError(data.message || 'Could not find profile. Check the handle.');
      }
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const processResult = (result) => {
    let pts = 0;
    const stats = { Basic: 0, Easy: 0, Medium: 0, Hard: 0 };
    
    const multipliers = { Basic: 2, Easy: 5, Medium: 15, Hard: 40 };

    Object.keys(multipliers).forEach(category => {
      if (result[category]) {
        Object.values(result[category]).forEach(sub => {
          const subDate = new Date(sub.user_subtime.replace(' ', 'T') + 'Z');
          if (subDate >= CUTOFF_DATE) {
            pts += multipliers[category];
            stats[category]++;
          }
        });
      }
    });

    return { pts, stats };
  };

  const handleConfirm = async () => {
    if (!profileData) return;
    setLoading(true);
    const { pts: ptsAwarded } = processResult(profileData.result);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          gfg_handle: handle, 
          last_gfg_sync: new Date().toISOString() 
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Award points
      await supabase.rpc('increment_points', { 
        user_id: profile.id, 
        points_to_add: ptsAwarded 
      });

      setConfirmed(true);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (profile.gfg_handle || confirmed) {
    return (
      <div className="gfg-sync-card card active">
        <div className="sync-status">
          <div className="sync-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="sync-text">
            <h3>GfG Profile Connected</h3>
            <p>Handle: <strong>{profile.gfg_handle || handle}</strong></p>
          </div>
        </div>
        <div className="sync-stats-mini">
           <span>Only activity after <strong>May 18, 2026</strong> is tracked.</span>
        </div>
      </div>
    );
  }

  const { pts: previewPoints, stats: previewStats } = profileData ? processResult(profileData.result) : { pts: 0, stats: {} };

  return (
    <div className="gfg-sync-card card">
      {!profileData ? (
        <div className="gfg-setup">
          <div className="gfg-header">
            <img src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="GfG" />
            <h2>Link GfG Profile</h2>
          </div>
          <p className="setup-desc">Sync your practice progress to earn points. Only activity strictly <strong>after May 18, 2026</strong> will be counted.</p>
          <div className="gfg-input-group">
            <input 
              type="text" 
              placeholder="GfG Handle" 
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
            <button className="btn-primary" onClick={fetchGfGData} disabled={loading || !handle}>
              {loading ? '...' : 'Verify'}
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>
      ) : (
        <div className="gfg-preview animate-fade-in">
          <div className="preview-header">
            <h3>Is this you?</h3>
            <span className="handle-tag">@{handle}</span>
          </div>
          
          <div className="gfg-stats-grid">
            <div className="stat-item">
              <span className="count">{previewStats.Basic || 0}</span>
              <span className="label">Basic</span>
            </div>
            <div className="stat-item">
              <span className="count">{previewStats.Easy || 0}</span>
              <span className="label">Easy</span>
            </div>
            <div className="stat-item">
              <span className="count">{previewStats.Medium || 0}</span>
              <span className="label">Medium</span>
            </div>
            <div className="stat-item">
              <span className="count">{previewStats.Hard || 0}</span>
              <span className="label">Hard</span>
            </div>
          </div>

          <div className="points-preview">
             Points to be awarded: <strong>+{previewPoints}</strong>
             <small>Based on activity after <strong>May 18, 2026</strong></small>
          </div>

          <div className="confirmation-warning danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div className="warning-content">
              <strong>Final Confirmation Required</strong>
              <p>Once linked, this handle <strong>(@{handle})</strong> cannot be changed. All future points will be synced to this profile only.</p>
            </div>
          </div>

          <div className="preview-actions">
            <button className="btn-secondary" onClick={() => setProfileData(null)}>Back</button>
            <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Linking...' : 'Confirm & Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
