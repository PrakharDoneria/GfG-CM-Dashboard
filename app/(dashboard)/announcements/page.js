'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import './announcements.css';

export default function AnnouncementsPage() {
  const fetchAnnouncementsData = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    return data || [];
  };

  const { data: announcementsData, loading } = useCachedData('user_announcements_cache', fetchAnnouncementsData);
  const announcements = announcementsData || [];

  if (loading && !announcementsData) return <div className="loading-screen">Loading announcements...</div>;

  return (
    <div className="announcements-page">
      <h1 className="page-title">Program Announcements</h1>
      <div className="announcements-grid">
        {announcements.length > 0 ? announcements.map(ann => (
          <div key={ann.id} className="announcement-card card animate-fade-in">
            {ann.image_url && (
              <div className="announcement-image">
                <img src={ann.image_url} alt={ann.title} />
              </div>
            )}
            <div className="announcement-content">
              <span className="ann-date">{new Date(ann.created_at).toLocaleDateString()}</span>
              <h2>{ann.title}</h2>
              <p>{ann.body}</p>
            </div>
          </div>
        )) : (
          <div className="empty-state card">
            <p>No announcements yet. Stay tuned!</p>
          </div>
        )}
      </div>
    </div>
  );
}
