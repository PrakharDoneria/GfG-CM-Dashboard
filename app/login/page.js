'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const isAdmin = session.user.email.endsWith('@geeksforgeeks.org');
        router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const isAdmin = email.endsWith('@geeksforgeeks.org');
      
      await supabase
        .from('profiles')
        .update({ role: isAdmin ? 'admin' : 'cm' })
        .eq('id', data.user.id);

      router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-wrapper">
            <span>GfG</span>
          </div>
          <h1>Campus Mantri</h1>
          <p>Task Tracking Dashboard</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <div className="switch">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <span className="slider"></span>
              </div>
              <span>Remember Me</span>
            </label>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? <div className="loading-spinner-small"></div> : 'Sign In'}
          </button>
        </form>

        {loading && <p className="verifying-text">Verifying credentials...</p>}
        
        <div className="login-footer">
          <p className="made-by">Made with 💚 by <a href="https://github.com/prakhardoneria" target="_blank" rel="noopener noreferrer">@prakhardoneria</a></p>
        </div>
      </div>
    </div>
  );
}
