import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Transform } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import {
    validateFileSignature,
    getExtensionFromMimeType,
    sanitizeFilename,
    MAX_FILE_SIZE,
    FILE_EXPIRATION_MS,
} from '../utils/validation';

/**
 * Upload result returned to client
 */
export interface UploadResult {
    file_id: string;
    url: string;
    size: number;
    mime_type: string;
    expires_at: string;
}

/**
 * Custom error types for upload failures
 */
export class UploadError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = 'UploadError';
    }
}

/**
 * Upload service handling streaming uploads with deduplication
 */
export class UploadService {
    /**
     * Process uploaded file with streaming, validation, and deduplication
     * Uses a temporary file to avoid streaming backpressure deadlocks
     */
    async processUpload(
        fileStream: NodeJS.ReadableStream,
        originalFilename: string
    ): Promise<UploadResult> {
        const sanitizedFilename = sanitizeFilename(originalFilename);
        const tempId = uuidv4();
        const tempPath = path.join(process.cwd(), 'uploads', `temp_${tempId}`);

        let totalSize = 0;
        let firstChunk: Buffer | null = null;
        let mimeType: string | null = null;
        const hash = crypto.createHash('sha256');

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        try {
            // Create write stream for temporary file
            const tempWriteStream = fs.createWriteStream(tempPath);

            // Create validation and hash transform stream
            const processingStream = new Transform({
                transform(chunk: Buffer, _encoding, callback) {
                    totalSize += chunk.length;

                    // 1. Size Validation
                    if (totalSize > MAX_FILE_SIZE) {
                        return callback(new UploadError('File exceeds maximum size of 5 MB', 413));
                    }

                    // 2. Type/Signature Validation (First chunk only)
                    if (!firstChunk) {
                        firstChunk = chunk;
                        mimeType = validateFileSignature(chunk);
                        if (!mimeType) {
                            return callback(new UploadError('Unsupported file type', 415));
                        }
                    }

                    // 3. Update Hash
                    hash.update(chunk);

                    callback(null, chunk);
                }
            });

            // Pipeline: Input -> Processing -> Temp File
            await new Promise<void>((resolve, reject) => {
                fileStream.pipe(processingStream).pipe(tempWriteStream);

                tempWriteStream.on('finish', resolve);

                processingStream.on('error', (err) => {
                    tempWriteStream.destroy();
                    reject(err);
                });

                fileStream.on('error', (_err) => {
                    processingStream.destroy();
                    tempWriteStream.destroy();
                    reject(new UploadError('Upload failed due to network error', 500));
                });
            });

            const fileHash = hash.digest('hex');

            // 4. Check for existing file (Deduplication)
            const existingFile = db.findByHash(fileHash);

            if (existingFile) {
                // Duplicate found: Cleanup temp file and use existing record
                fs.unlink(tempPath, () => { });
                db.incrementReferenceCount(fileHash);
                console.log(`[Upload] Deduplicated: ${fileHash} (Ref incremented)`);

                return {
                    file_id: existingFile.id,
                    url: `/api/files/${existingFile.id}`,
                    size: existingFile.size,
                    mime_type: existingFile.mime_type,
                    expires_at: new Date(existingFile.expires_at).toISOString(),
                };
            }

            // 5. New File: Move from temp to permanent hashed name
            if (!mimeType) throw new UploadError('Validation failed', 500);

            const extension = getExtensionFromMimeType(mimeType);
            const permanentFilename = `${fileHash}.${extension}`;
            const permanentPath = path.join(uploadDir, permanentFilename);

            // Atomic move if possible, or copy+delete
            if (fs.existsSync(permanentPath)) {
                fs.unlinkSync(tempPath); // Should have been caught by db check but safety first
            } else {
                fs.renameSync(tempPath, permanentPath);
            }

            // 6. DB Record Creation
            const fileId = uuidv4();
            const now = Date.now();
            const expiresAt = now + FILE_EXPIRATION_MS;

            db.insert({
                id: fileId,
                hash: fileHash,
                storage_path: permanentPath,
                original_name: sanitizedFilename,
                size: totalSize,
                mime_type: mimeType,
                created_at: now,
                expires_at: expiresAt,
            });

            console.log(`[Upload] New file stored: ${fileId} (${totalSize} bytes)`);

            return {
                file_id: fileId,
                url: `/api/files/${fileId}`,
                size: totalSize,
                mime_type: mimeType,
                expires_at: new Date(expiresAt).toISOString(),
            };

        } catch (error) {
            // Cleanup temp file on any error
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            console.error('[Upload] Process error:', error);
            throw error;
        }
    }
}

export const uploadService = new UploadService();
