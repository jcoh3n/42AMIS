import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

// 42 API endpoints and credentials
const TOKEN_URL = 'https://api.intra.42.fr/oauth/token';
const API_URL = 'https://api.intra.42.fr/v2';
const CAMPUSES_TO_UPDATE = [1]; // Array of campus IDs to update

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 42 API Client credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing 42 API credentials. Check your environment variables.');
  process.exit(1);
}

// Function to get a client credentials access token
async function getAccessToken() {
  console.log('Requesting new access token via client credentials...');

  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'public',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received');
    }
    
    console.log(`Successfully obtained access token. Expires in ${data.expires_in} seconds.`);
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Function to fetch location data from 42 API
async function fetchLocations(token: string, campusId: number) {
  console.log(`Fetching locations for campus ${campusId}...`);
  const locations = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const url = `${API_URL}/locations?filter[campus_id]=${campusId}&filter[active]=true&page[number]=${page}&page[size]=${perPage}`;
      console.log(`Fetching page ${page}...`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch locations: ${errorText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`No more data from API on page ${page}.`);
        break;
      }

      locations.push(...data);
      console.log(`Fetched ${data.length} locations from page ${page}.`);

      if (data.length < perPage) {
        break;
      }

      page++;
      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1100));
    }

    console.log(`Total locations fetched for campus ${campusId}: ${locations.length}`);
    return locations;
  } catch (error) {
    console.error(`Error fetching locations for campus ${campusId}:`, error);
    throw error;
  }
}

// Function to update Supabase with location data
async function updateSupabaseLocations(campusId: number, locations: Record<string, any>[]) {
  console.log(`Updating Supabase with ${locations.length} locations for campus ${campusId}...`);

  try {
    // First, delete all existing locations for this campus
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('campus_id', campusId);

    if (deleteError) {
      throw new Error(`Error deleting old locations: ${deleteError.message}`);
    }

    console.log(`Deleted old locations for campus ${campusId}.`);

    // Prepare data for insertion
    const locationsToInsert = locations.map(location => {
      const user = location.user || {};
      
      return {
        host: location.host,
        user_login: user.login,
        user_displayname: user.displayname,
        user_image_micro: user.image?.versions?.micro || null,
        campus_id: location.campus_id,
        begin_at: location.begin_at,
        last_api_update: new Date().toISOString()
      };
    });

    // Insert new locations in batches of 100
    const batchSize = 100;
    for (let i = 0; i < locationsToInsert.length; i += batchSize) {
      const batch = locationsToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('locations')
        .insert(batch);

      if (insertError) {
        throw new Error(`Error inserting locations: ${insertError.message}`);
      }
      
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} locations).`);
    }

    console.log(`Successfully updated Supabase with ${locationsToInsert.length} locations for campus ${campusId}.`);
  } catch (error) {
    console.error(`Error updating Supabase for campus ${campusId}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Update each campus
    for (const campusId of CAMPUSES_TO_UPDATE) {
      try {
        // Fetch locations from 42 API
        const locations = await fetchLocations(accessToken, campusId);
        
        // Update Supabase with the fetched locations
        await updateSupabaseLocations(campusId, locations);
        
        console.log(`Successfully updated campus ${campusId} data.`);
      } catch (error) {
        console.error(`Failed to update campus ${campusId}:`, error);
      }

      // Wait between campus updates
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('Update process completed.');
  } catch (error) {
    console.error('Error in the update process:', error);
  }
}

// Run the main function
main(); 