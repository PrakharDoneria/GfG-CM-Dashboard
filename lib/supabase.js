import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createNoopQueryBuilder() {
  const builder = {
    select() {
      return builder;
    },
    insert() {
      return builder;
    },
    update() {
      return builder;
    },
    delete() {
      return builder;
    },
    eq() {
      return builder;
    },
    not() {
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    gt() {
      return builder;
    },
    single() {
      return Promise.resolve({ data: null, error: null });
    },
    then(resolve, reject) {
      return Promise.resolve({ data: null, error: null, count: 0 }).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve({ data: null, error: null, count: 0 }).catch(reject);
    },
    finally(onFinally) {
      return Promise.resolve({ data: null, error: null, count: 0 }).finally(onFinally);
    },
  };

  return builder;
}

function createNoopSupabaseClient() {
  const queryBuilder = createNoopQueryBuilder();

  return {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async signInWithPassword() {
        return {
          data: null,
          error: { message: 'Supabase environment variables are not configured.' },
        };
      },
      async signOut() {
        return { error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    from() {
      return queryBuilder;
    },
    rpc() {
      return Promise.resolve({ data: null, error: null });
    },
  };
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabaseClient();

/** Expected no-session errors that should be silenced, not logged. */
const SILENT_ERRORS = [
  'Auth session missing',
  'Refresh Token Not Found',
  'Invalid Refresh Token',
  'AuthSessionMissingError',
];

const isSilentError = (msg = '') => SILENT_ERRORS.some(s => msg.includes(s));

export const safeGetSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isSilentError(error.message)) {
        await supabase.auth.signOut().catch(() => {});
        if (typeof window !== 'undefined') localStorage.removeItem('user_role');
        return { session: null, error: null };
      }
      throw error;
    }
    return { session: data.session, error: null };
  } catch (err) {
    if (isSilentError(err?.message)) {
      return { session: null, error: null };
    }
    console.error('Auth check error:', err);
    return { session: null, error: err };
  }
};

export const safeGetUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isSilentError(error.message)) {
        await supabase.auth.signOut().catch(() => {});
        if (typeof window !== 'undefined') localStorage.removeItem('user_role');
        return { user: null, error: null };
      }
      throw error;
    }
    return { user: data.user, error: null };
  } catch (err) {
    if (isSilentError(err?.message)) {
      return { user: null, error: null };
    }
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
