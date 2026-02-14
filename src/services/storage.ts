import * as fs from 'fs';
import * as path from 'path';

/**
 * Storage provider interface for future extensibility (e.g., S3)
 */
export interface IStorageProvider {
    save(filename: string, stream: NodeJS.ReadableStream): Promise<string>;
    delete(filepath: string): Promise<void>;
    getPath(filename: string): string;
}

/**
 * Local filesystem storage implementation
 */
export class LocalStorageProvider implements IStorageProvider {
    private uploadDir: string;

    constructor(uploadDir: string = 'uploads') {
        this.uploadDir = path.resolve(uploadDir);
        this.ensureUploadDirectory();
    }

    /**
     * Ensure upload directory exists
     */
    private ensureUploadDirectory(): void {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
            console.log(`[Storage] Created upload directory: ${this.uploadDir}`);
        }
    }

    /**
     * Save file from stream
     * @param filename - Name to save file as
     * @param stream - Readable stream of file data
     * @returns Full path to saved file
     */
    async save(filename: string, stream: NodeJS.ReadableStream): Promise<string> {
        const filepath = path.join(this.uploadDir, filename);

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filepath);

            stream.pipe(writeStream);

            writeStream.on('finish', () => {
                resolve(filepath);
            });

            writeStream.on('error', (error) => {
                // Clean up partial file on error
                fs.unlink(filepath, () => { });
                reject(error);
            });

            stream.on('error', (error) => {
                writeStream.destroy();
                fs.unlink(filepath, () => { });
                reject(error);
            });
        });
    }

    /**
     * Delete file from storage
     */
    async delete(filepath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.unlink(filepath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    // Ignore "file not found" errors
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Get full path for a filename
     */
    getPath(filename: string): string {
        return path.join(this.uploadDir, filename);
    }
}

// Singleton instance
export const storage = new LocalStorageProvider();
