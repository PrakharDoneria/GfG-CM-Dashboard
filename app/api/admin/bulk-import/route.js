import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { users } = await request.json();
    
    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid users data' }, { status: 400 });
    }

    const results = {
      success: [],
      errors: []
    };

    // Process in batches of 10 to avoid hitting too many concurrent requests
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (user) => {
        try {
          // 1. Create user in Auth
          const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password || 'GfG@CM2026', // Default password if none provided
            email_confirm: true, // AUTO-CONFIRM EMAIL (Task 1)
            user_metadata: {
              full_name: user.full_name,
              college_name: user.college_name
            }
          });

          if (authError) throw authError;

          // 2. Profile is usually created by a trigger, but let's ensure it has the right role
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              role: 'cm',
              full_name: user.full_name,
              college_name: user.college_name
            })
            .eq('id', data.user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          return { email: user.email, status: 'success' };
        } catch (err) {
          return { email: user.email, status: 'error', message: err.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(res => {
        if (res.status === 'success') {
          results.success.push(res.email);
        } else {
          results.errors.push({ email: res.email, message: res.message });
        }
      });
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
