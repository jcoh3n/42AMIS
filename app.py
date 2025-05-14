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
    print("[STARTUP] Running on Vercel serverless environment - SocketIO disabled")

# For Vercel, use /tmp for database since the filesystem is read-only except for /tmp
DATABASE_FILE = '/tmp/local_cache.sqlite' if IS_VERCEL else 'local_cache.sqlite'
print(f"[STARTUP] Database file location: {DATABASE_FILE}")

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

@app.route('/admin')
def admin():
    # Simple access control - you might want something more secure
    if 'access_token' not in session:
        return redirect('/login')
    return render_template('admin.html')

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

# Enable CORS for API routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

# Add a route to manually trigger data update (useful for serverless environment)
@app.route('/api/update_data', methods=['GET'])
def update_data_endpoint():
    try:
        # Check if there's an access token in the session or as a parameter
        token = session.get('access_token') or request.args.get('token')
        if not token:
            return jsonify({"status": "error", "message": "No access token available"}), 401
            
        # Get campus_id from request or default to 1
        campus_id = request.args.get('campus_id', 1, type=int)
        
        # Here you would normally run the updater logic
        # For example, you might call a function that fetches from 42 API and updates the DB
        # For demonstration, we'll just return a success message
        
        print(f"[UPDATE] Manual update triggered for campus_id={campus_id}")
        return jsonify({"status": "success", "message": "Data update was triggered"})
    except Exception as e:
        print(f"[ERROR] Update error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Special endpoint for automated updates that doesn't require authentication
# This can be called by cron services like cron-job.org or GitHub Actions
@app.route('/api/cron/update', methods=['GET'])
def cron_update():
    try:
        # Get secret key from request to validate the request is authorized
        secret = request.args.get('secret')
        expected_secret = os.getenv('CRON_SECRET', 'default_secret_change_me')
        
        if not secret or secret != expected_secret:
            print(f"[CRON] Unauthorized access attempt to cron endpoint")
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
        # Get campus_id from request or default to update all main campuses
        campus_id = request.args.get('campus_id')
        
        # Import updater functions
        from updater import get_access_token, update_campus_locations
        
        # Get access token for 42 API
        access_token = get_access_token()
        if not access_token:
            return jsonify({"status": "error", "message": "Failed to get access token"}), 500
        
        # Update all main campuses if no specific campus specified
        if not campus_id:
            campuses = [1, 7, 21]  # Paris, Brussels, Lausanne
            update_results = {}
            
            for campus in campuses:
                try:
                    # Use the update function from updater.py
                    result = update_campus_locations(campus, access_token)
                    update_results[f"campus_{campus}"] = "updated" if result else "failed"
                except Exception as e:
                    update_results[f"campus_{campus}"] = f"error: {str(e)}"
            
            return jsonify({
                "status": "success", 
                "timestamp": time.time(),
                "results": update_results
            })
        else:
            # Update only the specified campus
            campus_id = int(campus_id)
            print(f"[CRON] Updating data for campus_id={campus_id}")
            
            # Use the update function from updater.py
            result = update_campus_locations(campus_id, access_token)
            
            return jsonify({
                "status": "success" if result else "partial_failure", 
                "timestamp": time.time(),
                "campus": campus_id
            })
    
    except Exception as e:
        print(f"[CRON] Error during cron update: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Add a simple status/health endpoint
@app.route('/api/status', methods=['GET'])
def status():
    """Return simple status info for monitoring."""
    env_type = "Vercel" if IS_VERCEL else "Local"
    return jsonify({
        "status": "ok",
        "environment": env_type,
        "timestamp": time.time(),
        "redirect_uri": REDIRECT_URI,
        "version": "1.0.1"  # Increment this when you make significant changes
    })

# Required for Vercel serverless functions
if IS_VERCEL:
    # Return the Flask app for serverless use
    app_handler = app
else:
    # For local development, run with SocketIO
    if __name__ == '__main__':
        socketio.run(app, debug=True, port=5000) 