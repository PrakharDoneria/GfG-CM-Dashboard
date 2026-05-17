'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import './GfGIntegration.css';

export default function GfGIntegration({ profile, onSyncSuccess }) {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [postsData, setPostsData] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const CUTOFF_DATE = new Date('2026-05-17T00:00:00Z');

  const fetchGfGData = async () => {
    if (!handle) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Coding Submissions
      const submissionsResponse = await fetch('/api/gfg/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, requestType: '', year: '', month: '' })
      });
      const submissionsJson = await submissionsResponse.json();

      if (submissionsJson.status !== 'success') {
        setError(submissionsJson.message || 'Could not find coding profile. Check the handle.');
        setLoading(false);
        return;
      }

      // 2. Fetch Community Posts
      const postsResponse = await fetch(`/api/gfg/posts?handle=${encodeURIComponent(handle)}`);
      const postsJson = await postsResponse.json();

      let details = null;
      if (postsJson.results && postsJson.results.length > 0) {
        details = postsJson.results[0].user_details;
      } else {
        // Fallback user details if no posts are returned
        details = {
          handle: handle,
          name: handle,
          profile_img: 'https://media.geeksforgeeks.org/auth/profile/zqlad90qljnr5parsuwa',
          bio_snippet: 'GeeksforGeeks Participant',
          user_headline: 'GFG Geek'
        };
      }

      setProfileData(submissionsJson);
      setPostsData(postsJson);
      setUserDetails(details);
    } catch (err) {
      setError('Network error or invalid handle. Try again.');
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

  const processPosts = (posts) => {
    let postPts = 0;
    let postCount = 0;
    let totalLikes = 0;
    let totalComments = 0;

    if (posts && Array.isArray(posts)) {
      posts.forEach(post => {
        const postDate = new Date(post.created_at.replace(' ', 'T') + 'Z');
        if (postDate >= CUTOFF_DATE) {
          postCount++;
          const likes = post.like_count || 0;
          const comments = post.comment_count || 0;
          totalLikes += likes;
          totalComments += comments;
          
          // 15 base points, 2 points per like, 5 points per comment
          postPts += 15 + (likes * 2) + (comments * 5);
        }
      });
    }
    return { postPts, postCount, totalLikes, totalComments };
  };

  const handleConfirm = async () => {
    if (!profileData) return;
    setLoading(true);
    
    const { pts: codingPoints } = processResult(profileData.result);
    const { postPts: communityPoints } = processPosts(postsData?.results);
    const totalPointsAwarded = codingPoints + communityPoints;
    
    try {
      // Fetch manual task points first
      const { data: approvedSubs } = await supabase
        .from('submissions')
        .select('points_awarded')
        .eq('user_id', profile.id)
        .eq('status', 'approved');
      
      const manualPoints = approvedSubs ? approvedSubs.reduce((acc, sub) => acc + (sub.points_awarded || 0), 0) : 0;
      const finalPoints = totalPointsAwarded + manualPoints;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          gfg_handle: userDetails?.handle || handle, 
          gfg_profile_img: userDetails?.profile_img || null,
          points: finalPoints,
          last_gfg_sync: new Date().toISOString() 
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setConfirmed(true);
      if (onSyncSuccess) onSyncSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (profile.gfg_handle || confirmed) {
    const avatarUrl = profile.gfg_profile_img || userDetails?.profile_img;
    return (
      <div className="gfg-sync-card card active">
        <div className="sync-status">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="GfG Profile" 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid var(--primary)',
                objectFit: 'cover',
                flexShrink: 0
              }} 
            />
          ) : (
            <div className="sync-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          )}
          <div className="sync-text">
            <h3>GfG Profile Connected</h3>
            <p>Handle: <strong>{profile.gfg_handle || handle}</strong></p>
          </div>
        </div>
        <div className="sync-stats-mini">
           <span>Only activity after <strong>May 17, 2028</strong> is tracked.</span>
        </div>
      </div>
    );
  }

  const { pts: previewPoints, stats: previewStats } = profileData ? processResult(profileData.result) : { pts: 0, stats: {} };
  const { postPts: previewPostPoints, postCount, totalLikes, totalComments } = postsData ? processPosts(postsData.results) : { postPts: 0, postCount: 0, totalLikes: 0, totalComments: 0 };
  const totalPoints = previewPoints + previewPostPoints;

  return (
    <div className="gfg-sync-card card">
      {!profileData ? (
        <div className="gfg-setup">
          <div className="gfg-header">
            <img src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="GfG" />
            <h2>Link GfG Profile</h2>
          </div>
          <p className="setup-desc">Sync your practice progress & community posts to earn points. Only activity strictly <strong>after May 17, 2028</strong> will be counted.</p>
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
            <span className="handle-tag">@{userDetails?.handle || handle}</span>
          </div>

          {/* User Profile Card */}
          {userDetails && (
            <div className="gfg-user-profile-card" style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              background: 'var(--background)',
              borderRadius: '16px',
              border: '1.5px solid var(--border)',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              <img 
                src={userDetails.profile_img} 
                alt="Avatar" 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '2px solid var(--primary)',
                  objectFit: 'cover'
                }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '700' }}>
                  {userDetails.name}
                </h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                  {userDetails.user_headline}
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {userDetails.bio_snippet}
                </p>
              </div>
            </div>
          )}
          
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Coding Submissions
          </h4>
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

          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Community Contribution
          </h4>
          <div className="gfg-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-item">
              <span className="count">{postCount}</span>
              <span className="label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="count">{totalLikes}</span>
              <span className="label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="count">{totalComments}</span>
              <span className="label">Comments</span>
            </div>
          </div>

          {/* Points Award Break-down */}
          <div className="points-preview" style={{ padding: '16px', background: '#064e3b', color: 'white', borderRadius: '16px', textAlign: 'left', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
              <span>Coding practice points:</span>
              <strong>+{previewPoints}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.8rem', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
              <span>Community contribution:</span>
              <strong>+{previewPostPoints}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Points to be awarded:</span>
              <strong style={{ fontSize: '1.5rem', color: '#10b981' }}>+{totalPoints}</strong>
            </div>
            <small style={{ display: 'block', fontSize: '0.7rem', opacity: '0.8', marginTop: '6px', textAlign: 'center' }}>
              Based on activity after <strong>May 17, 2028</strong>
            </small>
          </div>

          <div className="confirmation-warning danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div className="warning-content">
              <strong>Final Confirmation Required</strong>
              <p>Once linked, this handle <strong>(@{userDetails?.handle || handle})</strong> cannot be changed. All future points will be synced to this profile only.</p>
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
