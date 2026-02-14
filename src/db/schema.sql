-- Files table: stores metadata for uploaded files
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    hash TEXT UNIQUE NOT NULL,
    storage_path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    reference_count INTEGER DEFAULT 1
);

-- Index for efficient hash lookups (deduplication)
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);

-- Index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
