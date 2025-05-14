const AUTH_URL = 'https://api.intra.42.fr/oauth/authorize';
const API_URL = 'https://api.intra.42.fr/v2';

export const get42AuthUrl = () => {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Missing OAuth configuration');
  }
  
  return `${AUTH_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=public`;
};

export const fetchLocations = async (accessToken: string, campusId = 1) => {
  const response = await fetch(`${API_URL}/locations?filter[campus_id]=${campusId}&filter[active]=true&page[size]=100`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch locations: ${errorText}`);
  }
  
  return response.json();
}; 