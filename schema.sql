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

CREATE INDEX IF NOT EXISTS idx_campus_id ON locations (campus_id); 