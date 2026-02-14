import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File metadata stored in database
 */
export interface FileRecord {
    id: string;
    hash: string;
    storage_path: string;
    original_name: string;
    size: number;
    mime_type: string;
    created_at: number;
    expires_at: number;
    reference_count: number;
}

/**
 * Database singleton for managing file metadata
 */
class DatabaseService {
    private db: Database.Database;

    constructor() {
        const dbPath = path.join(process.cwd(), 'uploads.db');
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL'); // Better concurrency
        this.initialize();
    }

    /**
     * Initialize database schema
     */
    private initialize(): void {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        this.db.exec(schema);
        console.log('[DB] Database initialized');
    }

    /**
     * Find file by hash (for deduplication)
     */
    findByHash(hash: string): FileRecord | undefined {
        const stmt = this.db.prepare('SELECT * FROM files WHERE hash = ?');
        return stmt.get(hash) as FileRecord | undefined;
    }

    /**
     * Find file by ID
     */
    findById(id: string): FileRecord | undefined {
        const stmt = this.db.prepare('SELECT * FROM files WHERE id = ?');
        return stmt.get(id) as FileRecord | undefined;
    }

    /**
     * Insert new file record
     */
    insert(record: Omit<FileRecord, 'reference_count'>): void {
        const stmt = this.db.prepare(`
      INSERT INTO files (id, hash, storage_path, original_name, size, mime_type, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            record.id,
            record.hash,
            record.storage_path,
            record.original_name,
            record.size,
            record.mime_type,
            record.created_at,
            record.expires_at
        );
    }

    /**
     * Increment reference count for existing file (deduplication)
     */
    incrementReferenceCount(hash: string): void {
        const stmt = this.db.prepare('UPDATE files SET reference_count = reference_count + 1 WHERE hash = ?');
        stmt.run(hash);
    }

    /**
     * Get expired files for cleanup
     */
    getExpiredFiles(): FileRecord[] {
        const now = Date.now();
        const stmt = this.db.prepare('SELECT * FROM files WHERE expires_at < ?');
        return stmt.all(now) as FileRecord[];
    }

    /**
     * Delete file record by ID
     */
    deleteById(id: string): void {
        const stmt = this.db.prepare('DELETE FROM files WHERE id = ?');
        stmt.run(id);
    }

    /**
     * Close database connection
     */
    close(): void {
        this.db.close();
    }
}

// Singleton instance
export const db = new DatabaseService();
