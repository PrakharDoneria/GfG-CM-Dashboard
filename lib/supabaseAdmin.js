import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Bulk operations will fail.');
}

function createNoopAdminClient() {
  const queryBuilder = {
    select() {
      return queryBuilder;
    },
    insert() {
      return queryBuilder;
    },
    update() {
      return queryBuilder;
    },
    delete() {
      return queryBuilder;
    },
    eq() {
      return queryBuilder;
    },
    not() {
      return queryBuilder;
    },
    order() {
      return queryBuilder;
    },
    limit() {
      return queryBuilder;
    },
    single() {
      return Promise.resolve({ data: null, error: null });
    },
    then(resolve, reject) {
      return Promise.resolve({ data: null, error: null, count: 0 }).then(resolve, reject);
    },
  };

  return {
    auth: {
      admin: {
        async createUser() {
          return {
            data: null,
            error: { message: 'Supabase service role key is not configured.' },
          };
        },
      },
    },
    from() {
      return queryBuilder;
    },
  };
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : createNoopAdminClient();
