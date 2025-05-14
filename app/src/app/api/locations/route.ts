import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.intra.42.fr/v2';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Fonction pour obtenir un token d'accès côté serveur
async function getServerAccessToken() {
  console.log('Attempting to get server access token');
  console.log('CLIENT_ID:', CLIENT_ID ? 'Exists' : 'Missing');
  console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'Exists' : 'Missing');
  
  try {
    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'public'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token request failed with status:', response.status);
      console.error('Token error response:', error);
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    console.log('Access token obtained successfully');
    return data.access_token;
  } catch (error) {
    console.error('Error getting server access token:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  console.log('API route /api/locations called');
  const searchParams = request.nextUrl.searchParams;
  const campusId = searchParams.get('campusId') || '1';
  console.log('Requested campusId:', campusId);

  try {
    // Obtenir un token d'accès côté serveur
    const accessToken = await getServerAccessToken();
    console.log('Access token acquired');

    // Appeler l'API 42 pour obtenir les emplacements
    const url = `${API_URL}/locations?filter[campus_id]=${campusId}&filter[active]=true&page[size]=100`;
    console.log('Fetching locations from:', url);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Locations fetch failed with status:', response.status);
      console.error('Locations error response:', error);
      throw new Error(`Failed to fetch locations: ${error}`);
    }

    const locationsData = await response.json();
    console.log(`Successfully fetched ${Array.isArray(locationsData) ? locationsData.length : 'unknown'} locations`);
    
    return NextResponse.json(locationsData);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 