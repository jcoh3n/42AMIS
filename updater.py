import requests
import sqlite3
import time
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = 'https://api.intra.42.fr/v2'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token' # Added token URL
DATABASE_FILE = 'local_cache.sqlite'
CAMPUSES_TO_UPDATE = [1]
ACCESS_TOKEN = None

# --- Helper to get a valid 42 API Access Token using Client Credentials ---
def get_access_token():
    global ACCESS_TOKEN
    client_id = os.getenv('CLIENT_ID')
    client_secret = os.getenv('CLIENT_SECRET')

    if not client_id or not client_secret:
        print("Updater Error: CLIENT_ID or CLIENT_SECRET not found in .env for client credentials flow.")
        return None
    payload = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
        'scope': 'public'
    }
    try:
        print("Updater: Requesting new access token via client credentials...")
        response = requests.post(TOKEN_URL, data=payload, timeout=10)
        response.raise_for_status()
        token_data = response.json()
        ACCESS_TOKEN = token_data.get('access_token')
        if ACCESS_TOKEN:
            expires_in = token_data.get('expires_in', 7200)
            print(f"Updater: Successfully obtained new access token. Expires in {expires_in} seconds.")
            return ACCESS_TOKEN
        else:
            print(f"Updater Error: Could not get access_token from 42 API response: {token_data}")
            return None
    except requests.exceptions.HTTPError as http_err:
        print(f"Updater HTTP error during token request: {http_err} - Response: {http_err.response.text if http_err.response else 'No response text'}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Updater Error during client credentials token request: {e}")
        return None
    except Exception as e:
        print(f"Updater: A general error occurred during token acquisition: {e}")
        return None

def update_campus_locations(campus_id, token):
    print(f"Updater: Starting update for campus {campus_id}...")
    db = sqlite3.connect(DATABASE_FILE)
    cursor = db.cursor()

    all_locations_from_api = []
    page = 1
    per_page = 100 # Fetch 100 items per page
    headers = {'Authorization': f'Bearer {token}'}

    while True:
        try:
            locations_url = f"{API_URL}/locations?filter[campus_id]={campus_id}&filter[active]=true&page[number]={page}&page[size]={per_page}"
            print(f"Updater: Fetching {locations_url}")
            response = requests.get(locations_url, headers=headers, timeout=15) # Increased timeout slightly
            response.raise_for_status() 

            current_page_data = response.json()
            if not isinstance(current_page_data, list): # Ensure API returns a list
                print(f"Updater: API did not return a list for page {page}. Response: {current_page_data}")
                break
            if not current_page_data: # No more data
                print(f"Updater: No more data from API on page {page}.")
                break
            
            all_locations_from_api.extend(current_page_data)
            print(f"Updater: Fetched page {page}, got {len(current_page_data)} items.")

            if len(current_page_data) < per_page: # Last page
                break
            page += 1
            time.sleep(1.1) # Respect rate limits
        except requests.exceptions.HTTPError as http_err:
            print(f"Updater: HTTP error fetching page {page} for campus {campus_id}: {http_err} - Response: {http_err.response.text if http_err.response else 'No response text'}")
            if page == 1 and not all_locations_from_api:
                db.close()
                return False 
            break 
        except requests.exceptions.RequestException as e:
            print(f"Updater: Request error fetching page {page} for campus {campus_id}: {e}")
            if page == 1 and not all_locations_from_api: 
                db.close()
                return False
            break 
        except Exception as e:
            print(f"Updater: General error during page fetch {page} for campus {campus_id}: {e}")
            if page == 1 and not all_locations_from_api:
                db.close()
                return False
            break

    if not all_locations_from_api and page > 1:
        print(f"Updater: Proceeding with data fetched before error on page {page}.")
    
    # ---- Database Update Logic ----
    # Clear old entries for this campus before inserting new batch
    try:
        cursor.execute("DELETE FROM locations WHERE campus_id = ?", (campus_id,))
        print(f"Updater: Cleared old locations for campus {campus_id} from DB.")
    except sqlite3.Error as e:
        print(f"Updater: DB Error clearing locations for campus {campus_id}: {e}")
        # Decide if you want to proceed if clearing fails. For now, we'll try to insert.

    inserted_count = 0
    for loc in all_locations_from_api:
        user = loc.get('user', {})
        user_login = user.get('login')
        user_displayname = user.get('displayname')
        user_image_micro = user.get('image', {}).get('versions', {}).get('micro')
        
        if not loc.get('host') or not user_login or not loc.get('begin_at') or loc.get('campus_id') is None:
            print(f"Updater: Skipping location with missing critical data: host='{loc.get('host')}', login='{user_login}', begin_at='{loc.get('begin_at')}', campus_id='{loc.get('campus_id')}'")
            continue

        try:
            cursor.execute("""
                INSERT OR REPLACE INTO locations 
                (host, user_login, user_displayname, user_image_micro, campus_id, begin_at, last_api_update)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                loc['host'], 
                user_login,
                user_displayname,
                user_image_micro,
                loc['campus_id'], 
                loc['begin_at']
            ))
            inserted_count +=1
        except sqlite3.Error as e:
            print(f"Updater: DB Error inserting/replacing {loc.get('host')}/{user_login}: {e}")
            
    db.commit()
    db.close()
    print(f"Updater: Finished update for campus {campus_id}. Inserted/Replaced {inserted_count}/{len(all_locations_from_api)} locations into DB.")
    return True

if __name__ == '__main__':
    # Initial token fetch
    current_token = get_access_token()
    if not current_token:
        print("Updater: Exiting. Could not obtain initial access token.")
        exit()

    last_token_refresh_time = time.time()
    # Token typically expires in 7200 seconds (2 hours)
    # Refresh a bit earlier, e.g., after 90% of its lifetime or a fixed shorter interval
    TOKEN_LIFETIME_SECONDS = os.getenv('TOKEN_LIFETIME_SECONDS', 7000) 


    while True:
        # Check if token needs refresh
        if time.time() - last_token_refresh_time > TOKEN_LIFETIME_SECONDS: # e.g. refresh every ~1h55m
            print("Updater: Access token lifetime nearing end, attempting to refresh.")
            new_token = get_access_token()
            if new_token:
                current_token = new_token
                last_token_refresh_time = time.time()
            else:
                print("Updater: Failed to refresh token. Will retry next cycle. Using old token for now if still valid.")
                # Consider stopping if token refresh fails repeatedly. For now, it will just keep trying.
        
        for campus_id_to_update in CAMPUSES_TO_UPDATE:
            print(f"Updater: Updating campus {campus_id_to_update}...")
            success = update_campus_locations(campus_id_to_update, current_token)
            if success:
                print(f"Updater: Successfully updated campus {campus_id_to_update}.")
            else:
                print(f"Updater: Failed to fully update campus {campus_id_to_update}.")
            time.sleep(5) 
        
        wait_time = 60 * 5 
        print(f"Updater: All campuses processed. Waiting {wait_time/60} minutes for next cycle.")
        time.sleep(wait_time) 