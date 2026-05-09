import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { handle, requestType = '', year = '', month = '' } = body;

    if (!handle) {
      return NextResponse.json({ status: 'error', message: 'Handle is required' }, { status: 400 });
    }

    const response = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ handle, requestType, year, month }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GfG Proxy Error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
