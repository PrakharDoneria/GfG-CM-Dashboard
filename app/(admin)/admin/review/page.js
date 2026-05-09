'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import './review.css';

import Modal from '@/components/Modal';

export default function ReviewTasksPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [notification, setNotification] = useState({ open: false, title: '', message: '', type: 'default' });
  const [reviewData, setReviewData] = useState({
    id: null,
    status: '',
    feedback: ''
  });

  const fetchSubmissionsData = async () => {
    const { data } = await supabase
      .from('submissions')
      .select(`
        *,
        tasks (
          title,
          points_value
        )
      `)
      .eq('status', activeTab)
      .order('created_at', { ascending: true });

    return data || [];
  };

  const { data: submissionsData, loading, setData } = useCachedData(`admin_review_cache_${activeTab}`, fetchSubmissionsData);
  const submissions = submissionsData || [];

  const showNotification = (title, message, type = 'default') => {
    setNotification({ open: true, title, message, type });
  };

  const handleAction = async (id, status) => {
    setReviewData({ id, status, feedback: '' });
  };

  const submitReview = async () => {
    const { id, status, feedback } = reviewData;
    
    // If approved, update user points
    if (status === 'approved') {
      const sub = submissions.find(s => s.id === id);
      const points = sub.tasks.points_value;
      
      // Update CM points
      await supabase.rpc('increment_points', { 
        user_id: sub.user_id, 
        points_to_add: points 
      });
    }

    const { error } = await supabase
      .from('submissions')
      .update({ 
        status, 
        feedback: feedback || (status === 'approved' ? 'Accepted, Good Job!' : 'Rejected'),
        points_awarded: status === 'approved' ? submissions.find(s => s.id === id).tasks.points_value : 0
      })
      .eq('id', id);

    if (!error) {
      showNotification('Success', `Task ${status} successfully!`, 'success');
      setReviewData({ id: null, status: '', feedback: '' });
      const freshData = await fetchSubmissionsData();
      setData(freshData);
      localStorage.setItem(`admin_review_cache_${activeTab}`, JSON.stringify(freshData));
    } else {
      showNotification('Error', error.message, 'error');
    }
  };

  if (loading && !submissionsData) return <div className="loading-screen">Loading submissions for review...</div>;

  return (
    <div className="review-container">
      <h1 className="page-title">Review Task Submissions</h1>

      <div className="tab-switcher">
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({submissions.filter(s => s.status === 'pending').length})
        </button>
        <button 
          className={activeTab === 'approved' ? 'active' : ''} 
          onClick={() => setActiveTab('approved')}
        >
          Recently Approved
        </button>
      </div>

      <div className="review-grid">
        {submissions.length > 0 ? submissions.map(sub => (
          <div key={sub.id} className="review-card card animate-fade-in">
            <div className="review-card-header">
              <span className="task-type">TASK SUBMISSION</span>
              <span className="sub-date">{new Date(sub.created_at).toLocaleString()}</span>
            </div>
            
            <div className="review-content">
              <h3>{sub.tasks?.title}</h3>
              <div className="summary-box">
                <p><strong>Summary of Work:</strong></p>
                <p className="work-summary">{sub.summary}</p>
              </div>
              
              <div className="proof-box">
                <p><strong>Proof Attachment:</strong></p>
                <a href={sub.proof_url} target="_blank" rel="noreferrer" className="btn-secondary">
                  Open {sub.proof_type} Proof 🔗
                </a>
              </div>
            </div>

            <div className="review-footer">
              <div className="reward-info">
                <span>Potential Reward: </span>
                <strong>{sub.tasks?.points_value} Points</strong>
              </div>
              
              {activeTab === 'pending' && (
                <div className="review-actions">
                  <button 
                    className="btn-reject" 
                    onClick={() => handleAction(sub.id, 'rejected')}
                  >
                    Reject
                  </button>
                  <button 
                    className="btn-approve" 
                    onClick={() => handleAction(sub.id, 'approved')}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>

            {reviewData.id === sub.id && (
              <div className="review-modal-overlay">
                <div className="review-modal card">
                  <h3>Finalize {reviewData.status}</h3>
                  <textarea 
                    placeholder="Add feedback (optional)..."
                    value={reviewData.feedback}
                    onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                  />
                  <div className="modal-actions">
                    <button className="btn-text" onClick={() => setReviewData({id:null})}>Cancel</button>
                    <button className="btn-primary" onClick={submitReview}>Confirm {reviewData.status}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="empty-state card">
            <p>No submissions to review in this category.</p>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <Modal isOpen={notification.open} onClose={() => setNotification({open:false})} title={notification.title} type={notification.type}>
        <p style={{textAlign: 'center', fontSize: '1.1rem'}}>{notification.message}</p>
        <div style={{marginTop: '24px', display: 'flex', justifyContent: 'center'}}>
          <button className="btn-primary" onClick={() => setNotification({open:false})}>OK</button>
        </div>
      </Modal>
    </div>
  );
}
