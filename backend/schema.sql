-- SQLite schema for 42AMIS

-- Drop tables if they exist
DROP TABLE IF EXISTS locations;

-- Create locations table
CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    host TEXT,
    user_id INTEGER NULL,
    user_login TEXT NULL,
    user_display_name TEXT NULL,
    user_image_url TEXT NULL,
    floor TEXT,
    row INTEGER,
    col INTEGER,
    is_occupied BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_locations_floor ON locations(floor);
CREATE INDEX IF NOT EXISTS idx_locations_host ON locations(host);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id); 