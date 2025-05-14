import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  console.log('Callback API route called with code:', code ? 'Code exists' : 'No code');
  console.log('Environment variables check:');
  console.log('- NEXT_PUBLIC_CLIENT_ID:', process.env.NEXT_PUBLIC_CLIENT_ID ? 'Set' : 'Not set');
  console.log('- CLIENT_SECRET:', process.env.CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('- NEXT_PUBLIC_REDIRECT_URI:', process.env.NEXT_PUBLIC_REDIRECT_URI);

  if (!code) {
    console.log('Error: No code provided');
    return NextResponse.json(
      { error: 'Code is required' },
      { status: 400 }
    );
  }

  try {
    console.log('Making token request with params:');
    console.log('- grant_type: authorization_code');
    console.log('- redirect_uri:', process.env.NEXT_PUBLIC_REDIRECT_URI);
    
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token error response:', errorData);
      console.error('Token error status:', tokenResponse.status);
      return NextResponse.json(
        { error: 'Failed to get access token', details: errorData },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token successfully obtained');
    
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 