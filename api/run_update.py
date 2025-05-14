from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import sqlite3

# Add parent directory to path so we can import from update_locations
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.update_locations import get_access_token, update_campus_locations, create_locations_table_if_not_exists, CAMPUSES_TO_UPDATE

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Ensure database table exists
            create_locations_table_if_not_exists()
            
            # Get access token
            token = get_access_token()
            if not token:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "error",
                    "message": "Failed to obtain API token"
                }).encode())
                return
                
            # Update locations for each campus
            results = {}
            for campus_id in CAMPUSES_TO_UPDATE:
                success = update_campus_locations(campus_id, token)
                results[f"campus_{campus_id}"] = "success" if success else "error"
                
            # Return success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "message": "Location data updated",
                "results": results
            }).encode())
            
        except Exception as e:
            # Return error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "error",
                "message": str(e)
            }).encode()) 