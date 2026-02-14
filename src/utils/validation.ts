/**
 * Magic byte signatures for supported image formats
 */
const MAGIC_BYTES = {
    JPEG: [0xff, 0xd8, 0xff],
    PNG: [0x89, 0x50, 0x4e, 0x47],
    GIF: [0x47, 0x49, 0x46, 0x38],
    WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    WEBP_WEBP: [0x57, 0x45, 0x42, 0x50], // "WEBP" at offset 8
};

/**
 * Supported MIME types
 */
export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

/**
 * Maximum file size (5 MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * File expiration time (24 hours in milliseconds)
 */
export const FILE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Validate file signature using magic bytes
 * @param buffer - First bytes of the file
 * @returns MIME type if valid, null otherwise
 */
export function validateFileSignature(buffer: Buffer): string | null {
    // Check JPEG
    if (buffer.length >= 3 &&
        buffer[0] === MAGIC_BYTES.JPEG[0] &&
        buffer[1] === MAGIC_BYTES.JPEG[1] &&
        buffer[2] === MAGIC_BYTES.JPEG[2]) {
        return 'image/jpeg';
    }

    // Check PNG
    if (buffer.length >= 4 &&
        buffer[0] === MAGIC_BYTES.PNG[0] &&
        buffer[1] === MAGIC_BYTES.PNG[1] &&
        buffer[2] === MAGIC_BYTES.PNG[2] &&
        buffer[3] === MAGIC_BYTES.PNG[3]) {
        return 'image/png';
    }

    // Check GIF
    if (buffer.length >= 4 &&
        buffer[0] === MAGIC_BYTES.GIF[0] &&
        buffer[1] === MAGIC_BYTES.GIF[1] &&
        buffer[2] === MAGIC_BYTES.GIF[2] &&
        buffer[3] === MAGIC_BYTES.GIF[3]) {
        return 'image/gif';
    }

    // Check WEBP (RIFF at start, WEBP at offset 8)
    if (buffer.length >= 12 &&
        buffer[0] === MAGIC_BYTES.WEBP_RIFF[0] &&
        buffer[1] === MAGIC_BYTES.WEBP_RIFF[1] &&
        buffer[2] === MAGIC_BYTES.WEBP_RIFF[2] &&
        buffer[3] === MAGIC_BYTES.WEBP_RIFF[3] &&
        buffer[8] === MAGIC_BYTES.WEBP_WEBP[0] &&
        buffer[9] === MAGIC_BYTES.WEBP_WEBP[1] &&
        buffer[10] === MAGIC_BYTES.WEBP_WEBP[2] &&
        buffer[11] === MAGIC_BYTES.WEBP_WEBP[3]) {
        return 'image/webp';
    }

    return null;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/gif':
            return 'gif';
        case 'image/webp':
            return 'webp';
        default:
            return 'bin';
    }
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
