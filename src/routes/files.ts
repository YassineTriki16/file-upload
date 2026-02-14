import { Router, Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import * as fs from 'fs';
import { uploadService, UploadError } from '../services/upload';
import { db } from '../db';

const router = Router();

/**
 * POST /api/files/upload
 * Upload a single image file
 */
router.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contentType = req.headers['content-type'];

        if (!contentType || !contentType.includes('multipart/form-data')) {
            return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
        }

        const busboy = Busboy({ headers: req.headers });
        let fileProcessed = false;

        busboy.on('file', async (_fieldname: string, file: NodeJS.ReadableStream, info: any) => {
            const { filename } = info;

            if (fileProcessed) {
                file.resume(); // Drain additional files
                return;
            }

            fileProcessed = true;

            try {
                const result = await uploadService.processUpload(file, filename);
                res.status(200).json(result);
            } catch (error) {
                // Drain the stream to prevent hanging
                file.resume();

                if (error instanceof UploadError) {
                    res.status(error.statusCode).json({ error: error.message });
                } else {
                    console.error('[API] Upload error:', error);
                    res.status(500).json({ error: 'Upload failed due to server error' });
                }
            }
        });

        busboy.on('finish', () => {
            if (!fileProcessed) {
                res.status(400).json({ error: 'No file provided' });
            }
        });

        busboy.on('error', (error: Error) => {
            console.error('[API] Busboy error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Upload failed due to server error' });
            }
        });

        req.pipe(busboy);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/files/:id
 * Retrieve uploaded file
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const fileRecord = db.findById(id);

        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found or expired' });
        }

        // Check if file has expired
        if (fileRecord.expires_at < Date.now()) {
            return res.status(404).json({ error: 'File not found or expired' });
        }

        // Check if file exists on disk
        if (!fs.existsSync(fileRecord.storage_path)) {
            console.error(`[API] File missing from storage: ${fileRecord.storage_path}`);
            return res.status(404).json({ error: 'File not found or expired' });
        }

        // Set security headers
        res.setHeader('Content-Type', fileRecord.mime_type);
        res.setHeader('Content-Length', fileRecord.size);
        res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
        res.setHeader('Content-Disposition', `inline; filename="${fileRecord.original_name}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        // Stream file to response
        const fileStream = fs.createReadStream(fileRecord.storage_path);

        fileStream.on('error', (error) => {
            console.error('[API] File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to retrieve file' });
            }
        });

        fileStream.pipe(res);
    } catch (error) {
        console.error('[API] Retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
});

/**
 * DELETE /api/files/:id
 * Delete uploaded file
 */
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const fileRecord = db.findById(id);

        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete file from storage
        if (fs.existsSync(fileRecord.storage_path)) {
            fs.unlinkSync(fileRecord.storage_path);
        }

        // Delete from database
        db.deleteById(id);

        console.log(`[API] File deleted: ${id}`);
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('[API] Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
