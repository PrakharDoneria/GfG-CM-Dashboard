'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import Modal from '@/components/Modal';
import '@/app/(admin)/admin/tasks/admin-tasks.css';

export default function AdminAnnouncementsPage() {
  const [notification, setNotification] = useState({ open: false, title: '', message: '', type: 'default' });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    image_url: ''
  });

  const fetchAnnouncementsData = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    return data || [];
  };

  const { data: announcementsData, loading, setData } = useCachedData('admin_announcements_cache', fetchAnnouncementsData);
  const announcements = announcementsData || [];

  const showNotification = (title, message, type = 'default') => {
    setNotification({ open: true, title, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('announcements')
      .insert({ ...formData, created_by: user.id });
    
    if (!error) {
      showNotification('Success', 'Announcement published successfully!', 'success');
      setFormData({ title: '', body: '', image_url: '' });
      const freshData = await fetchAnnouncementsData();
      setData(freshData);
      localStorage.setItem('admin_announcements_cache', JSON.stringify(freshData));
    } else {
      showNotification('Error', error.message, 'error');
    }
  };

  const askDelete = (id) => {
    setConfirmModal({ open: true, id });
  };

  const handleDelete = async () => {
    const id = confirmModal.id;
    await supabase.from('announcements').delete().eq('id', id);
    setConfirmModal({ open: false, id: null });
    
    const freshData = await fetchAnnouncementsData();
    setData(freshData);
    localStorage.setItem('admin_announcements_cache', JSON.stringify(freshData));
    showNotification('Deleted', 'Announcement removed.', 'success');
  };

  if (loading && !announcementsData) return <div className="loading-screen">Loading announcements...</div>;

  return (
    <div className="admin-tasks-container">
      <div className="page-header">
        <h1 className="page-title">Manage Announcements</h1>
        <p className="subtext">Broadcast important updates to all Campus Mantris</p>
      </div>

      <div className="admin-tasks-grid">
        <div className="task-form-section">
          <h2>
            <div className="section-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a3 3 0 0 0 3-3V8Z"></path><path d="M10 12h.01"></path><path d="M13 18l-2-4"></path><path d="M13 6l-2 4"></path></svg>
            </div>
            Broadcast Update
          </h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Announcement Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., May Submission Deadline Extended" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Body Content</label>
              <textarea 
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="Write the full announcement details here..." 
                required 
              />
            </div>

            <div className="form-group">
              <label>External Link (Optional)</label>
              <input 
                type="url" 
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://..." 
              />
            </div>

            <button type="submit" className="btn-primary" style={{marginTop: '8px'}}>
              Publish Announcement
            </button>
          </form>
        </div>

        <div className="task-list-section">
          <h2>
             <div className="section-title-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
             </div>
             Recent History
          </h2>
          <div className="admin-task-list">
            {announcements.length > 0 ? announcements.map(ann => (
              <div key={ann.id} className="admin-task-item">
                <div className="task-info">
                  <h3>{ann.title}</h3>
                  <p>{ann.body.substring(0, 100)}{ann.body.length > 100 ? '...' : ''}</p>
                  <div className="announcement-date-admin" style={{marginTop: '8px'}}>
                    Posted on {new Date(ann.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="task-controls">
                  <button className="icon-btn delete" onClick={() => askDelete(ann.id)} title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            )) : (
              <div className="empty-admin-state">
                <span className="empty-admin-state-icon">📭</span>
                <h4>No announcements yet</h4>
                <p>Start by broadcasting your first update.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({open:false, id:null})} title="Delete Announcement">
        <p style={{textAlign: 'center', marginBottom: '24px'}}>Are you sure you want to delete this broadcast? This cannot be undone.</p>
        <div style={{display: 'flex', gap: '12px'}}>
          <button className="btn-primary" style={{flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444'}} onClick={handleDelete}>Delete Permanently</button>
          <button className="btn-secondary" style={{flex: 1}} onClick={() => setConfirmModal({open:false, id:null})}>Cancel</button>
        </div>
      </Modal>

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
