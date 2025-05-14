import flask
from flask import Flask, render_template, request, redirect, session, jsonify
from flask_socketio import SocketIO
import requests
import os
from dotenv import load_dotenv
import time
import sqlite3 # Import sqlite3

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Check if we're running on Vercel
VERCEL_ENV = os.environ.get('VERCEL_ENV')
IS_VERCEL = VERCEL_ENV is not None

# Only initialize SocketIO if not on Vercel, as it's not fully compatible with serverless
if not IS_VERCEL:
    socketio = SocketIO(app, cors_allowed_origins="*")
else:
    socketio = None

# For Vercel, use /tmp for database since the filesystem is read-only except for /tmp
DATABASE_FILE = '/tmp/local_cache.sqlite' if IS_VERCEL else 'local_cache.sqlite'

# --- Database Setup ---
def get_db():
    db = getattr(flask, '_database', None)
    if db is None:
        db = flask._database = sqlite3.connect(DATABASE_FILE)
        db.row_factory = sqlite3.Row # Access columns by name
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(flask, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()
        print("Database initialized.")

# Call init_db() once when the app starts if the DB file doesn't exist or is empty.
# More robust checks might be needed for production.
# For simplicity, we can call it manually or ensure schema.sql is run once.
# For now, let's ensure the table exists or create it.

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

create_locations_table_if_not_exists()

# --- End Database Setup ---


# 42 API configuration
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET') # Make sure CLIENT_SECRET is in your .env
API_URL = 'https://api.intra.42.fr/v2'
AUTH_URL = 'https://api.intra.42.fr/oauth/authorize'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token'

# Use the REDIRECT_URL from .env file
REDIRECT_URI = os.getenv('REDIRECT_URL', 'http://localhost:5000/callback')
print(f"[STARTUP] REDIRECT_URI configured as: {REDIRECT_URI}")
print(f"[STARTUP] Environment variables: REDIRECT_URL={os.getenv('REDIRECT_URL')}, VERCEL_ENV={VERCEL_ENV}")

@app.route('/')
def index():
    if 'access_token' not in session:
        return redirect('/login')
    return render_template('index.html')

@app.route('/login')
def login():
    auth_url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=public"
    print(f"[LOGIN] Redirecting to: {auth_url}")
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    print(f"--- In /callback ---")
    print(f"Received code: {code}")
    print(f"Using CLIENT_ID: {CLIENT_ID}")
    print(f"Using REDIRECT_URI: {REDIRECT_URI}")
    print(f"Callback URL as seen by request: {request.base_url}")
    print(f"Full request URL: {request.url}")
    print(f"Request headers: {dict(request.headers)}")
    
    if not code:
        print("Callback error: No code received from 42 API.")
        return 'Error: No code received', 400

    data = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET, # Use the loaded client secret
        'code': code,
        'redirect_uri': REDIRECT_URI
    }
    
    response = requests.post(TOKEN_URL, data=data)
    if response.status_code != 200:
        print(f"Error exchanging code for token. Status: {response.status_code}")
        print(f"Response headers: {response.headers}")
        try:
            print(f"Response JSON: {response.json()}")
        except requests.exceptions.JSONDecodeError:
            print(f"Response text: {response.text}")
        return 'Error: Failed to get access token', 400

    session['access_token'] = response.json()['access_token']
    return redirect('/')

@app.route('/api/locations')
def get_locations_from_db(): # Renamed function
    campus_id_filter = request.args.get('campus_id', 1, type=int) # Default to campus 1 if not specified
    
    # For now, we will implement querying the local DB here.
    # This function will be called by the frontend.
    # The actual 42 API calls will be moved to a separate updater script.
    
    db = sqlite3.connect(DATABASE_FILE)
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    
    # Query the local database
    # We select distinct user-host pairs based on the latest_api_update for that pair, 
    # effectively getting the most recent known state for each user at each host.
    # This still doesn't perfectly emulate "active within X minutes" unless updater script handles that.
    # A simpler query for now:
    cursor.execute("""
        SELECT host, user_login, user_displayname, user_image_micro, campus_id, begin_at 
        FROM locations 
        WHERE campus_id = ? 
        ORDER BY begin_at DESC
    """, (campus_id_filter,))
    
    rows = cursor.fetchall()
    db.close()
    
    # Convert rows to list of dicts to mimic original API response structure (partially)
    # The frontend expects an array of objects, where each object has user->login, user->displayname etc.
    # and location->host
    processed_locations = []
    for row in rows:
        processed_locations.append({
            "host": row["host"],
            "user": {
                "login": row["user_login"],
                "displayname": row["user_displayname"],
                "image": { "versions": { "micro": row["user_image_micro"] } }
            },
            "begin_at": row["begin_at"],
            "campus_id": row["campus_id"]
            # Add other fields if your frontend uses them, like end_at, id, primary
        })
    
    print(f"Backend: Returning {len(processed_locations)} locations from DB for campus {campus_id_filter}")
    return jsonify(processed_locations)

# For Vercel serverless deployment
@app.route('/_vercel/static/<path:filename>')
def vercel_static(filename):
    return app.send_static_file(filename)

# Required for Vercel serverless functions
if IS_VERCEL:
    # Return the Flask app for serverless use
    app_handler = app
else:
    # For local development, run with SocketIO
    if __name__ == '__main__':
        socketio.run(app, debug=True, port=5000) 