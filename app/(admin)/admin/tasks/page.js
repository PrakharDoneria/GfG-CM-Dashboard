'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import Modal from '@/components/Modal';
import './admin-tasks.css';

export default function AdminTasksPage() {
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ open: false, title: '', message: '', type: 'default' });
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    due_date: '',
    priority: 'Medium',
    points_value: 100,
    max_submissions: 2
  });

  const fetchTasksData = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    return data || [];
  };

  const { data: tasksData, loading, setData } = useCachedData('admin_tasks_cache', fetchTasksData);
  const tasks = tasksData || [];

  const showNotification = (title, message, type = 'default') => {
    setNotification({ open: true, title, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (editingId) {
      const { error } = await supabase
        .from('tasks')
        .update(formData)
        .eq('id', editingId);
      
      if (!error) {
        showNotification('Success', 'Task updated successfully!', 'success');
        setEditingId(null);
      } else {
        showNotification('Error', error.message, 'error');
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert({ ...formData, created_by: user.id });
      
      if (!error) {
        showNotification('Success', 'Task created successfully!', 'success');
      } else {
        showNotification('Error', error.message, 'error');
      }
    }

    setFormData({
      title: '',
      body: '',
      due_date: '',
      priority: 'Medium',
      points_value: 100,
      max_submissions: 2
    });
    const freshData = await fetchTasksData();
    setData(freshData);
    localStorage.setItem('admin_tasks_cache', JSON.stringify(freshData));
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      body: task.body,
      due_date: task.due_date.split('T')[0],
      priority: task.priority,
      points_value: task.points_value,
      max_submissions: task.max_submissions
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const askDelete = (id) => {
    setConfirmModal({ open: true, id });
  };

  const handleDelete = async () => {
    const id = confirmModal.id;
    await supabase.from('tasks').delete().eq('id', id);
    setConfirmModal({ open: false, id: null });
    
    const freshData = await fetchTasksData();
    setData(freshData);
    localStorage.setItem('admin_tasks_cache', JSON.stringify(freshData));
    showNotification('Deleted', 'Task has been removed.', 'success');
  };

  if (loading && !tasksData) return <div className="loading-screen">Loading tasks...</div>;

  return (
    <div className="admin-tasks-container">
      <h1 className="page-title">Task Management</h1>

      <div className="admin-tasks-grid">
        <div className="task-form-section card">
          <h2 className="title-with-icon">
            {!editingId && (
              <span className="section-title-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
            )}
            <span>{editingId ? 'Edit Task' : 'Create New Task'}</span>
          </h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Task Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. LinkedIn Post about GFG" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="Describe the task requirements..." 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Points Value</label>
                <input 
                  type="number" 
                  value={formData.points_value}
                  onChange={(e) => setFormData({...formData, points_value: parseInt(e.target.value)})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Max Submissions</label>
                <input 
                  type="number" 
                  value={formData.max_submissions}
                  onChange={(e) => setFormData({...formData, max_submissions: parseInt(e.target.value)})}
                  required 
                />
              </div>
            </div>

            <div className="form-actions">
              {editingId && <button type="button" className="btn-text" onClick={() => setEditingId(null)}>Cancel</button>}
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Task' : 'Publish Task'}
              </button>
            </div>
          </form>
        </div>

        <div className="task-list-section card">
          <h2>Existing Tasks</h2>
          <div className="admin-task-list">
            {tasks.map(task => (
              <div key={task.id} className="admin-task-item">
                <div className="task-info">
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <h3>{task.title}</h3>
                  <p>Due: {new Date(task.due_date).toLocaleDateString()}</p>
                </div>
                <div className="task-controls">
                  <button className="icon-btn edit" onClick={() => handleEdit(task)} aria-label="Edit task" title="Edit task">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M4 20h4l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="icon-btn delete" onClick={() => askDelete(task.id)} aria-label="Delete task" title="Delete task">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M8 7l.7 11a2 2 0 0 0 2 1.9h2.6a2 2 0 0 0 2-1.9L16 7" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({open:false, id:null})} title="Confirm Deletion">
        <p style={{textAlign: 'center'}}>Are you sure you want to delete this task? This action cannot be undone.</p>
        <div style={{marginTop: '24px', display: 'flex', gap: '12px'}}>
          <button className="btn-primary" style={{flex: 1, backgroundColor: '#ef4444'}} onClick={handleDelete}>Delete</button>
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
