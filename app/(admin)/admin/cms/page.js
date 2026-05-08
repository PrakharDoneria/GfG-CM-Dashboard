'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import './cms.css';

import { useCachedData } from '@/lib/useCachedData';
import Modal from '@/components/Modal';

export default function ManageCMPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCM, setSelectedCM] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [notification, setNotification] = useState({ open: false, title: '', message: '', type: 'default' });

  const [newCm, setNewCm] = useState({
    email: '',
    full_name: '',
    college_name: '',
    password: ''
  });

  const fetchCMs = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cm')
      .order('points', { ascending: false });
    return data || [];
  };

  const { data: cms, loading, setData } = useCachedData('admin_cms_cache', fetchCMs);

  const filteredCms = (cms || []).filter(cm => 
    cm.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    cm.email?.toLowerCase().includes(search.toLowerCase()) ||
    cm.college_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredCms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCms = filteredCms.slice(startIndex, startIndex + itemsPerPage);

  const topPerformers = [...(cms || [])].sort((a, b) => b.points - a.points).slice(0, 3);

  const showNotification = (title, message, type = 'default') => {
    setNotification({ open: true, title, message, type });
  };

  const handleAddCM = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newCm.email.trim(),
        password: newCm.password.trim(),
        options: {
          data: {
            full_name: newCm.full_name,
            college_name: newCm.college_name
          }
        }
      });
      
      if (error) throw error;
      
      showNotification('Success', 'CM created successfully in Auth and Database!', 'success');
      setNewCm({ email: '', full_name: '', college_name: '', password: '' });
      const freshData = await fetchCMs();
      setData(freshData);
      localStorage.setItem('admin_cms_cache', JSON.stringify(freshData));
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  const handleViewDetails = (cm) => {
    setSelectedCM(cm);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditCM = (cm) => {
    setSelectedCM({ ...cm });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleUpdateCM = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: selectedCM.full_name,
          college_name: selectedCM.college_name,
          points: selectedCM.points
        })
        .eq('id', selectedCM.id);

      if (error) throw error;

      showNotification('Success', 'CM profile updated successfully!', 'success');
      setIsModalOpen(false);
      const freshData = await fetchCMs();
      setData(freshData);
      localStorage.setItem('admin_cms_cache', JSON.stringify(freshData));
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  const downloadTemplate = () => {
    const headers = "full_name,email,college_name,phone_number\nJohn Doe,john@example.com,IIT Delhi,+919876543210";
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'cm_import_template.csv');
    a.click();
  };

  if (loading && !cms) return <div className="loading-screen">Loading CM Directory...</div>;

  return (
    <div className="admin-cms-container">
      <div className="admin-header-row">
        <h1 className="page-title">Manage Campus Mantris</h1>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search by name, email or college..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="top-performers-row">
        {topPerformers.map((cm, index) => (
          <div key={cm.id} className="performer-card card">
            <div className="rank">#{index + 1}</div>
            <div className="performer-info">
              <h3>{cm.full_name}</h3>
              <p>{cm.college_name}</p>
              <span className="performer-points">{cm.points} Points</span>
            </div>
          </div>
        ))}
      </div>

      <div className="cm-management-grid">
        <div className="cm-list-section card">
          <div className="card-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              All Campus Mantris ({filteredCms.length})
            </h2>
          </div>
          <div className="cm-table-wrapper">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>College</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCms.length > 0 ? paginatedCms.map(cm => (
                  <tr key={cm.id}>
                    <td><strong>{cm.full_name}</strong><br/><small>{cm.email}</small></td>
                    <td>{cm.college_name}</td>
                    <td><span className="points-pill">{cm.points}</span></td>
                    <td>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button className="text-btn" onClick={() => handleViewDetails(cm)}>View</button>
                        <button className="text-btn" onClick={() => handleEditCM(cm)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>No mantris found</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="admin-side-panel">
          <div className="add-cm-section card">
            <div className="card-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Quick Add CM
              </h2>
            </div>
            <form onSubmit={handleAddCM} className="admin-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" value={newCm.full_name || ''} onChange={(e) => setNewCm({...newCm, full_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" value={newCm.email || ''} onChange={(e) => setNewCm({...newCm, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Default Password</label>
                <input type="password" placeholder="••••••••" value={newCm.password || ''} onChange={(e) => setNewCm({...newCm, password: e.target.value})} required minLength={6} />
              </div>
              <div className="form-group">
                <label>University / College</label>
                <input type="text" placeholder="IIT Delhi" value={newCm.college_name || ''} onChange={(e) => setNewCm({...newCm, college_name: e.target.value})} required />
              </div>
              <button type="submit" className="btn-primary w-full" style={{marginTop: '12px'}}>Create CM Profile</button>
            </form>
          </div>

          <div className="bulk-import-card card">
            <div className="card-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Bulk Import
              </h2>
            </div>
            <p className="import-help">Select a CSV file to import multiple Campus Mantris at once.</p>
            <div className="import-actions">
              <input type="file" accept=".csv" id="csv-upload" hidden />
              <label htmlFor="csv-upload" className="btn-primary-outline">
                Upload CSV
              </label>
              <button type="button" className="btn-secondary-outline" onClick={downloadTemplate}>
                Get Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? 'Edit Campus Mantri' : 'CM Details'}
      >
        {selectedCM && (
          <div className="cm-details-modal">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={selectedCM.full_name || ''} 
                disabled={!isEditing}
                onChange={(e) => setSelectedCM({...selectedCM, full_name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={selectedCM.email || ''} disabled />
            </div>
            <div className="form-group">
              <label>College Name</label>
              <input 
                type="text" 
                value={selectedCM.college_name || ''} 
                disabled={!isEditing}
                onChange={(e) => setSelectedCM({...selectedCM, college_name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Points</label>
              <input 
                type="number" 
                value={selectedCM.points === null ? 0 : selectedCM.points} 
                disabled={!isEditing}
                onChange={(e) => setSelectedCM({...selectedCM, points: parseInt(e.target.value) || 0})}
              />
            </div>
            {isEditing && (
              <div style={{marginTop: '20px', display: 'flex', gap: '12px'}}>
                <button className="btn-primary" style={{flex: 1}} onClick={handleUpdateCM}>Save Changes</button>
                <button className="btn-secondary" style={{flex: 1}} onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Global Notification Modal */}
      <Modal 
        isOpen={notification.open} 
        onClose={() => setNotification({ ...notification, open: false })} 
        title={notification.title}
        type={notification.type}
      >
        <p style={{textAlign: 'center', fontSize: '1.1rem'}}>{notification.message}</p>
        <div style={{marginTop: '24px', display: 'flex', justifyContent: 'center'}}>
          <button className="btn-primary" onClick={() => setNotification({ ...notification, open: false })}>Close</button>
        </div>
      </Modal>
    </div>
  );
}
