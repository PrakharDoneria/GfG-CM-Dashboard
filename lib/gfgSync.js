import { supabase } from './supabase';

export const syncGfGProfile = async (profileId, handle) => {
  try {
    const isBrowser = typeof window !== 'undefined';
    const fetchUrl = isBrowser ? '/api/gfg/submissions' : 'https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/';
    
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, requestType: '', year: '', month: '' })
    });
    
    const data = await response.json();
    if (data.status !== 'success') return { error: data.message };

    const result = data.result;
    const cutoffDate = new Date('2026-05-19T00:00:00Z');
    
    let pts = 0;
    const stats = { Basic: 0, Easy: 0, Medium: 0, Hard: 0 };

    const calculatePointsForCategory = (category, multiplier) => {
      if (!result[category]) return;
      Object.values(result[category]).forEach(sub => {
        const subDate = new Date(sub.user_subtime.replace(' ', 'T') + 'Z');
        if (subDate >= cutoffDate) {
          pts += multiplier;
          stats[category]++;
        }
      });
    };

    calculatePointsForCategory('Basic', 2);
    calculatePointsForCategory('Easy', 5);
    calculatePointsForCategory('Medium', 15);
    calculatePointsForCategory('Hard', 40);

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        points: pts,
        last_gfg_sync: new Date().toISOString() 
      })
      .eq('id', profileId);

    if (updateError) throw updateError;
    return { success: true, points: pts, stats };
  } catch (err) {
    return { error: err.message };
  }
};

export const syncAllProfiles = async () => {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, gfg_handle')
    .not('gfg_handle', 'is', null);

  const results = [];
  for (const profile of profiles) {
    const res = await syncGfGProfile(profile.id, profile.gfg_handle);
    results.push({ id: profile.id, ...res });
  }
  return results;
};
