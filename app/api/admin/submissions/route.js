import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminEmail } from '@/lib/authRoles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

async function requireAdmin(request) {
  if (!supabaseAuth) {
    return { error: 'Supabase is not configured.', status: 500 };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (isAdminEmail(user.email)) {
    return { user };
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') {
    return { user };
  }

  return { error: 'Forbidden', status: 403 };
}

export async function GET(request) {
  const access = await requireAdmin(request);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      *,
      tasks (
        title,
        points_value
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data || [] });
}

export async function PATCH(request) {
  const access = await requireAdmin(request);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const payload = await request.json();
  const id = payload?.id;
  const status = payload?.status;
  const feedback = typeof payload?.feedback === 'string' ? payload.feedback.trim() : '';

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid submission update.' }, { status: 400 });
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select(`
      id,
      user_id,
      tasks (
        points_value
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: fetchError?.message || 'Submission not found.' }, { status: 404 });
  }

  if (status === 'approved') {
    const points = submission.tasks?.points_value || 0;
    const { error: rpcError } = await supabaseAdmin.rpc('increment_points', {
      user_id: submission.user_id,
      points_to_add: points,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('submissions')
    .update({
      status,
      feedback: feedback || (status === 'approved' ? 'Accepted, Good Job!' : 'Rejected'),
      points_awarded: status === 'approved' ? (submission.tasks?.points_value || 0) : 0,
    })
    .eq('id', id)
    .select(`
      *,
      tasks (
        title,
        points_value
      )
    `)
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ submission: updated });
}