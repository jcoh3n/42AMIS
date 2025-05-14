import requests
import sqlite3
import os
from dotenv import load_dotenv
import time
from http.server import BaseHTTPRequestHandler

load_dotenv()

API_URL = 'https://api.intra.42.fr/v2'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
DATABASE_FILE = '/tmp/local_cache.sqlite'
CAMPUSES_TO_UPDATE = [1]  # Modify this list if you need to track other campuses

def get_access_token():
    client_id = os.getenv('CLIENT_ID')
    client_secret = os.getenv('CLIENT_SECRET')

    if not client_id or not client_secret:
        print("Updater Error: CLIENT_ID or CLIENT_SECRET not found in environment variables.")
        return None
    
    payload = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
        'scope': 'public'
    }
    
    try:
        response = requests.post(TOKEN_URL, data=payload, timeout=10)
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get('access_token')
        
        if access_token:
            print(f"Successfully obtained new access token.")
            return access_token
        else:
            print(f"Could not get access_token from 42 API response: {token_data}")
            return None
    except Exception as e:
        print(f"Error during token acquisition: {e}")
        return None

def create_locations_table_if_not_exists():
    db = sqlite3.connect(DATABASE_FILE)
    cursor = db.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        host TEXT NOT NULL,
        user_login TEXT NOT NULL,
        user_displayname TEXT,
        user_image_micro TEXT,
        campus_id INTEGER NOT NULL,
        begin_at TEXT NOT NULL, 
        last_api_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (host, user_login, campus_id, begin_at)
    );
    """)
    # Index for faster queries on campus_id
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_campus_id ON locations (campus_id);")
    db.commit()
    db.close()
    print("Locations table checked/created.")

def update_campus_locations(campus_id, token):
    print(f"Starting update for campus {campus_id}...")
    db = sqlite3.connect(DATABASE_FILE)
    cursor = db.cursor()

    all_locations_from_api = []
    page = 1
    per_page = 100  # Fetch 100 items per page
    headers = {'Authorization': f'Bearer {token}'}

    while True:
        try:
            locations_url = f"{API_URL}/locations?filter[campus_id]={campus_id}&filter[active]=true&page[number]={page}&page[size]={per_page}"
            print(f"Fetching {locations_url}")
            response = requests.get(locations_url, headers=headers, timeout=15)
            response.raise_for_status() 

            current_page_data = response.json()
            if not isinstance(current_page_data, list):
                print(f"API did not return a list for page {page}. Response: {current_page_data}")
                break
            if not current_page_data:  # No more data
                print(f"No more data from API on page {page}.")
                break
            
            all_locations_from_api.extend(current_page_data)
            print(f"Fetched page {page}, got {len(current_page_data)} items.")

            if len(current_page_data) < per_page:  # Last page
                break
            page += 1
            time.sleep(0.5)  # Respect rate limits, reduced for serverless execution
        except Exception as e:
            print(f"Error fetching page {page} for campus {campus_id}: {e}")
            if page == 1 and not all_locations_from_api:
                db.close()
                return False 
            break 

    try:
        cursor.execute("DELETE FROM locations WHERE campus_id = ?", (campus_id,))
        print(f"Cleared old locations for campus {campus_id} from DB.")
    except sqlite3.Error as e:
        print(f"DB Error clearing locations for campus {campus_id}: {e}")

    inserted_count = 0
    for loc in all_locations_from_api:
        user = loc.get('user', {})
        user_login = user.get('login')
        user_displayname = user.get('displayname')
        user_image_micro = user.get('image', {}).get('versions', {}).get('micro')
        
        if not loc.get('host') or not user_login or not loc.get('begin_at') or loc.get('campus_id') is None:
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
            inserted_count += 1
        except sqlite3.Error as e:
            print(f"DB Error inserting/replacing {loc.get('host')}/{user_login}: {e}")
            
    db.commit()
    db.close()
    print(f"Finished update for campus {campus_id}. Inserted/Replaced {inserted_count}/{len(all_locations_from_api)} locations.")
    return True

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        create_locations_table_if_not_exists()
        
        # Get access token 
        token = get_access_token()
        if not token:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write("Failed to obtain token".encode())
            return

        update_results = {}
        for campus_id in CAMPUSES_TO_UPDATE:
            success = update_campus_locations(campus_id, token)
            update_results[f"campus_{campus_id}"] = "success" if success else "error"
        
        # Return result
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        import json
        self.wfile.write(json.dumps({
            "status": "completed",
            "results": update_results,
            "timestamp": time.time()
        }).encode()) 