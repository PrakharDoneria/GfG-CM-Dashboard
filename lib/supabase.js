import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const safeGetSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
        await supabase.auth.signOut();
        localStorage.removeItem('user_role');
        return { session: null, error: null };
      }
      throw error;
    }
    return { session: data.session, error: null };
  } catch (err) {
    console.error('Auth check error:', err);
    return { session: null, error: err };
  }
};

export const safeGetUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
        await supabase.auth.signOut();
        localStorage.removeItem('user_role');
        return { user: null, error: null };
      }
      throw error;
    }
    return { user: data.user, error: null };
  } catch (err) {
    console.error('User check error:', err);
    return { user: null, error: err };
  }
};
// Global Auth State Listener to handle session issues (like "Invalid Refresh Token")
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESH_FAILED') {
      // If the session is invalid or refresh failed, clear local state and redirect
      if (event === 'TOKEN_REFRESH_FAILED') {
        console.warn('Session expired or invalid. Signing out...');
        localStorage.removeItem('user_role');
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user_role');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
  });
}
