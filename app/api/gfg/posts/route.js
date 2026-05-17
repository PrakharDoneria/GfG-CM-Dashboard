import { NextResponse } from 'next/server';

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    const page = searchParams.get('page') || '1';

    if (!handle) {
      return NextResponse.json(
        { status: 'error', message: 'Handle is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const cleanHandle = extractGfGHandle(handle);

    const spoofedHeaders = new Headers({
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
    });

    const response = await fetch(`https://communityapi.geeksforgeeks.org/post/user/${cleanHandle}/?fetch_type=posts&page=${page}`, {
      method: 'GET',
      headers: spoofedHeaders,
      cache: 'no-store'
    });

    if (response.status === 403) {
      return NextResponse.json(
        { status: 'error', message: 'Forbidden: GFG blocked the request.' },
        { status: 403, headers: getCorsHeaders() }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { status: 'error', message: 'Too Many Requests: Rate limited by GFG.' },
        { status: 429, headers: getCorsHeaders() }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('GfG Community API Proxy Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

// Support POST method as well
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { handle, page = '1' } = body;

    if (!handle) {
      return NextResponse.json(
        { status: 'error', message: 'Handle is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const cleanHandle = extractGfGHandle(handle);

    const spoofedHeaders = new Headers({
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
    });

    const response = await fetch(`https://communityapi.geeksforgeeks.org/post/user/${cleanHandle}/?fetch_type=posts&page=${page}`, {
      method: 'GET',
      headers: spoofedHeaders,
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json(data, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('GfG Community API Proxy Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
