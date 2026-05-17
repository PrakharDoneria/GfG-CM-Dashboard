import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

function extractGfGHandle(input) {
  if (!input) return '';
  let clean = input.trim();
  
  // Remove leading @
  if (clean.startsWith('@')) {
    clean = clean.substring(1);
  }
  
  // Handle URL inputs
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
  } catch (e) {
    // Fallback if URL parsing fails
  }
  
  // Remove trailing slashes and spaces
  return clean.replace(/\/$/, '').trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { handle, requestType = '', year = '', month = '' } = body;

    console.log('Incoming proxy request body:', body);
    
    const cleanHandle = extractGfGHandle(handle);
    console.log(`Extracted Handle: "${cleanHandle}" (Original: "${handle}")`);
    if (cleanHandle) {
      console.log('Handle char codes:', Array.from(cleanHandle).map(c => c.charCodeAt(0)));
    }

    if (!cleanHandle) {
      return NextResponse.json(
        { status: 'error', message: 'Handle is required' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const spoofedHeaders = new Headers({
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
    });

    const gfgPayload = JSON.stringify({ handle: cleanHandle, requestType, year, month });
    console.log('Forwarding payload to GFG:', gfgPayload);

    const response = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
      method: 'POST',
      headers: spoofedHeaders,
      body: gfgPayload,
      cache: 'no-store'
    });

    console.log('GFG Response status:', response.status);
    const data = await response.json();
    console.log('GFG Response data:', data);
    return NextResponse.json(data, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('GfG Proxy Error:', error);
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
