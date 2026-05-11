'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from '@/lib/useCachedData';
import { invalidateCache } from '@/lib/cacheUtils';
import { handleMarkdownShortcut, parseMarkdown } from '@/lib/markdownUtils';
import Modal from '@/components/Modal';
import CustomSelect from '@/components/CustomSelect';
import './tasks.css';

export default function TasksPage() {
  const summaryRef = useRef(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, title: '', message: '', type: 'default' });
  
  const [selectedTask, setSelectedTask] = useState('');
  const [summary, setSummary] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofType, setProofType] = useState('LinkedIn');

  const fetchTasksData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch all tasks
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    // Fetch user submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id);

    // Fetch user profile for points
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();

    const submittedIds = new Set(submissions?.map(s => s.task_id) || []);
    const approvedPoints = profile?.points || 0;

    return {
      allTasks: allTasks || [],
      submissions: submissions || [],
      submittedIds: Array.from(submittedIds),
      approvedPoints
    };
  };

  const { data, loading, setData } = useCachedData('user_tasks_cache', fetchTasksData);

  const allTasks = data?.allTasks || [];
  const submissions = data?.submissions || [];
  const submittedIds = new Set(data?.submittedIds || []);
  const approvedPoints = data?.approvedPoints || 0;

  const showNotification = (title, message, type = 'default') => {
    setNotification({ open: true, title, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) {
      showNotification('Selection Required', 'Please select a task to submit.', 'error');
      return;
    }
    
    setSubmitLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('submissions').insert({
      task_id: selectedTask,
      user_id: user.id,
      summary,
      proof_url: proofUrl,
      proof_type: proofType,
      status: 'pending'
    });

    setSubmitLoading(false);

    if (error) {
      showNotification('Error', error.message, 'error');
    } else {
      showNotification('Success', 'Task submitted successfully! Our team will review it soon.', 'success');
      setSelectedTask('');
      setSummary('');
      setProofUrl('');
      const freshData = await fetchTasksData();
      setData(freshData);
      localStorage.setItem('user_tasks_cache', JSON.stringify(freshData));
      
      // Invalidate related caches
      invalidateCache('dashboard_cache');
      invalidateCache('submissions_cache');
      invalidateCache('admin_review_cache');
    }
  };

  if (loading && !data) return <div className="loading-screen">Loading your tasks...</div>;

  const taskSubmissions = submissions?.reduce((acc, s) => {
    if (!acc[s.task_id]) acc[s.task_id] = [];
    acc[s.task_id].push(s);
    return acc;
  }, {}) || {};

  const pendingTasks = allTasks.filter(t => {
    const subs = taskSubmissions[t.id] || [];
    const isApproved = subs.some(s => s.status === 'approved');
    const isPending = subs.some(s => s.status === 'pending');
    const rejectedCount = subs.filter(s => s.status === 'rejected').length;
    const maxSubmissions = t.max_submissions || 2;

    if (isApproved || isPending) return false;
    if (subs.length === 0) return true;
    return rejectedCount < maxSubmissions;
  });

  const highPriorityCount = pendingTasks.filter(t => t.priority === 'High').length;
  const pointsAvailable = pendingTasks.reduce((acc, t) => acc + t.points_value, 0);
  const totalSubmitted = submissions.length;
  const progress = allTasks.length > 0 ? Math.round((submissions.filter(s => s.status === 'approved').length / allTasks.length) * 100) : 0;


  return (
    <div className="tasks-container">
      <h1 className="page-title">Assigned Tasks</h1>

      <div className="tasks-stats-row">
        <div className="task-stat-card blue">
          <div className="task-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          </div>
          <div className="task-stat-info">
            <span className="label">Remaining</span>
            <span className="value">{pendingTasks.length}</span>
            <span className="subtext">Pending tasks</span>
          </div>
        </div>
        
        <div className="task-stat-card purple">
          <div className="task-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l4 6-10 12L2 9z"></path><path d="M11 3 8 9l4 12 4-12-3-6z"></path><path d="M2 9h20"></path></svg>
          </div>
          <div className="task-stat-info">
            <span className="label">Points Available</span>
            <span className="value">+{pointsAvailable}</span>
            <span className="subtext">From pending tasks</span>
          </div>
        </div>

        <div className="task-stat-card orange">
          <div className="task-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 4 6.5 2 2 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
          </div>
          <div className="task-stat-info">
            <span className="label">High Priority</span>
            <span className="value">{highPriorityCount}</span>
            <span className="subtext">Need your attention</span>
          </div>
        </div>

        <div className="task-stat-card green">
          <div className="task-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="task-stat-info">
            <span className="label">Already Done</span>
            <span className="value">{totalSubmitted}</span>
            <span className="subtext">{approvedPoints.toLocaleString()} points earned</span>
          </div>
        </div>
      </div>

      <div className="task-completion-card">
        <div className="completion-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 11 3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            Task Completion
          </h2>
          <span className="completion-badge">{totalSubmitted}/{allTasks.length} Tasks</span>
        </div>
        <div className="completion-progress-track">
          <div className="completion-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="completion-footer">
          <span>{totalSubmitted} submitted · {pendingTasks.length} pending</span>
          <span>{progress}% overall progress</span>
        </div>
      </div>

      <div className="submit-task-card animate-fade-in">
        <div className="submit-card-header">
          <div className="plus-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <div className="submit-header-content">
            <h2>Submit Task Proof</h2>
            <p>Fill in the details below to submit your task for review</p>
          </div>
        </div>
        
        <div className="submit-card-body">
          <form onSubmit={handleSubmit} className="submit-form">
            <div className="form-group">
              <label>Select Task <span>*</span></label>
              <CustomSelect 
                value={selectedTask} 
                onChange={(e) => setSelectedTask(e.target.value)} 
                options={pendingTasks.map(t => ({
                  value: t.id,
                  label: `${t.title} (${t.points_value} pts)`
                }))}
                placeholder="Choose from your pending tasks..."
                required
              />
            </div>
            
            {selectedTask && (
              <div className="selected-task-details animate-fade-in">
                <div className="details-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Task Description
                </div>
                <div 
                  className="details-body markdown-body"
                  dangerouslySetInnerHTML={{ 
                    __html: parseMarkdown(pendingTasks.find(t => t.id === selectedTask)?.body || 'No description provided for this task.') 
                  }}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Work Summary <span>*</span></label>
              <textarea 
                ref={summaryRef}
                placeholder="Describe the work you've completed... (Supports Markdown: Ctrl+B, Ctrl+I, Ctrl+U)" 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                onKeyDown={(e) => handleMarkdownShortcut(e, summary, setSummary, summaryRef)}
                required
              />
            </div>

            <div className="form-row" style={{display: 'flex', gap: '20px'}}>
              <div className="form-group" style={{flex: 1}}>
                <label>Proof Type <span>*</span></label>
                <CustomSelect 
                  value={proofType} 
                  onChange={(e) => setProofType(e.target.value)}
                  options={[
                    { value: 'LinkedIn', label: 'LinkedIn' },
                    { value: 'Instagram', label: 'Instagram' },
                    { value: 'Twitter/X', label: 'Twitter/X' },
                    { value: 'Google Doc', label: 'Google Doc' },
                    { value: 'Other', label: 'Other Link' }
                  ]}
                />
              </div>
              <div className="form-group" style={{flex: 2}}>
                <label>Proof Link <span>*</span></label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={submitLoading || pendingTasks.length === 0} style={{padding: '16px', fontWeight: 700}}>
              {submitLoading ? 'Submitting...' : 'Submit Proof for Review'}
            </button>
          </form>
        </div>
      </div>

      <Modal isOpen={notification.open} onClose={() => setNotification({open:false})} title={notification.title} type={notification.type}>
        <p style={{textAlign: 'center', fontSize: '1.1rem'}}>{notification.message}</p>
        <div style={{marginTop: '24px', display: 'flex', justifyContent: 'center'}}>
          <button className="btn-primary" onClick={() => setNotification({open:false})}>OK</button>
        </div>
      </Modal>
    </div>
  );
}
