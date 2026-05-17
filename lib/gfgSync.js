import { supabase } from './supabase';

function extractGfGHandle(input) {
  if (!input) return '';
  let clean = input.trim();
  
  if (clean.startsWith('@')) {
    clean = clean.substring(1);
  }
  
  try {
    if (clean.includes('geeksforgeeks.org')) {
      const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const userIndex = pathParts.indexOf('user');
      const profileIndex = pathParts.indexOf('profile');
      if (userIndex !== -1 && pathParts[userIndex + 1]) {
        clean = pathParts[userIndex + 1];
      } else if (profileIndex !== -1 && pathParts[profileIndex + 1]) {
        clean = pathParts[profileIndex + 1];
      }
    }
  } catch (e) {}
  
  return clean.replace(/\/$/, '').trim();
}

export const syncGfGProfile = async (profileId, handle) => {
  try {
    const cleanHandle = extractGfGHandle(handle);
    if (!cleanHandle) {
      return { error: 'Invalid GFG Handle' };
    }

    const isBrowser = typeof window !== 'undefined';
    const fetchUrl = isBrowser ? '/api/gfg/submissions' : 'https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/';
    
    const headers = isBrowser 
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.geeksforgeeks.org',
          'Referer': 'https://www.geeksforgeeks.org/',
          'sec-ch-ua': '"Chromium";v="148", "Brave";v="148", "Not/A)Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'priority': 'u=1, i'
        };

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ handle: cleanHandle, requestType: '', year: '', month: '' })
    });
    
    if (response.status === 403 || response.status === 429) {
      return { error: `GFG API Error: ${response.status} - Blocked or Rate Limited` };
    }

    const data = await response.json();
    if (data.status !== 'success') return { error: data.message };

    const result = data.result;
    
    // count extra point before and date this date
    const cutoffDate = new Date('2026-05-17T00:00:00Z');
    
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

    // Fetch and Sync Community Posts
    const fetchPostsUrl = isBrowser 
      ? `/api/gfg/posts?handle=${cleanHandle}` 
      : `https://communityapi.geeksforgeeks.org/post/user/${cleanHandle}/?fetch_type=posts&page=1`;

    let postPts = 0;
    let postCount = 0;
    let totalLikes = 0;
    let totalComments = 0;

    let gfgProfileImg = null;
    try {
      const postsResponse = await fetch(fetchPostsUrl, {
        method: isBrowser ? 'POST' : 'GET',
        headers: isBrowser ? { 'Content-Type': 'application/json' } : headers,
        body: isBrowser ? JSON.stringify({ handle: cleanHandle, page: '1' }) : null
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        if (postsData.results && Array.isArray(postsData.results)) {
          if (postsData.results.length > 0) {
            gfgProfileImg = postsData.results[0].user_details?.profile_img || null;
          }
          postsData.results.forEach(post => {
            const postDate = new Date(post.created_at.replace(' ', 'T') + 'Z');
            if (postDate >= cutoffDate) {
              postCount++;
              const likes = post.like_count || 0;
              const comments = post.comment_count || 0;
              totalLikes += likes;
              totalComments += comments;
              
              // 15 base points, 2 points per like, 5 points per comment
              postPts += 15 + (likes * 2) + (comments * 5);
            }
          });
        }
      }
    } catch (postErr) {
      console.error('Failed to sync GFG posts:', postErr);
    }

    // Fetch manual task points to prevent overwriting them
    const { data: approvedSubs } = await supabase
      .from('submissions')
      .select('points_awarded')
      .eq('user_id', profileId)
      .eq('status', 'approved');
      
    const manualPoints = approvedSubs ? approvedSubs.reduce((acc, sub) => acc + (sub.points_awarded || 0), 0) : 0;
    const totalPts = pts + postPts + manualPoints;

    // Update profile
    const updatePayload = { 
      points: totalPts,
      last_gfg_sync: new Date().toISOString() 
    };
    if (gfgProfileImg) {
      updatePayload.gfg_profile_img = gfgProfileImg;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profileId);

    if (updateError) throw updateError;
    return { 
      success: true, 
      points: totalPts, 
      stats: {
        ...stats,
        posts: postCount,
        likes: totalLikes,
        comments: totalComments,
        postPoints: postPts
      } 
    };
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
