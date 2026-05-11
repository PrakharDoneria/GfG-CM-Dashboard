'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import Modal from '@/components/Modal';
import './profile.css';

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, title: '', message: '', type: 'default' });
  
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return data;
  };

  const { data: profile, loading, setData } = useCachedData('user_profile_cache', fetchProfile);
  const [formData, setFormData] = useState({
    full_name: '',
    college_name: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        college_name: profile.college_name || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        college_name: formData.college_name
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      setNotification({ open: true, title: 'Error', message: error.message, type: 'error' });
    } else {
      setNotification({ open: true, title: 'Success', message: 'Profile updated successfully!', type: 'success' });
      const freshData = await fetchProfile();
      setData(freshData);
      localStorage.setItem('user_profile_cache', JSON.stringify(freshData));
    }
  };

  if (loading && !profile) return <div className="loading-screen">Loading profile...</div>;

  return (
    <div className="profile-container animate-fade-in">
      <h1 className="page-title">My Profile</h1>
      
      <div className="profile-card card">
        <div className="profile-header">
          <div className="profile-avatar-xl">
            {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'CM'}
          </div>
          <div className="profile-main-info">
            <h2>{profile?.full_name}</h2>
            <p className="profile-role">Campus Mantri • Active</p>
            <div className="profile-stats-mini">
              <div className="mini-stat">
                <span className="val">{profile?.points || 0}</span>
                <span className="lbl">Points</span>
              </div>
              <div className="mini-stat">
                <span className="val">CM</span>
                <span className="lbl">Role</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section-title">Personal Details</div>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>College Name</label>
            <input 
              type="text" 
              value={formData.college_name}
              onChange={(e) => setFormData({...formData, college_name: e.target.value})}
              placeholder="Enter your college"
              required
            />
          </div>

          <div className="form-section-title">Read-Only Information</div>
          <div className="readonly-group">
            <label>Email Address</label>
            <div className="readonly-value">{profile?.email || 'N/A'}</div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      <Modal isOpen={notification.open} onClose={() => setNotification({open:false})} title={notification.title} type={notification.type}>
        <p style={{textAlign: 'center'}}>{notification.message}</p>
        <div style={{marginTop: '24px', display: 'flex', justifyContent: 'center'}}>
          <button className="btn-primary" onClick={() => setNotification({open:false})}>Got it</button>
        </div>
      </Modal>
    </div>
  );
}
