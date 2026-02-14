# SETUP_GUIDE.md

## Secure Image Upload System - Setup Guide

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)

### Installation Steps

1. **Navigate to the project directory**
```bash
cd "c:\Users\yassi\Desktop\file upload"
```

2. **Install dependencies** (Already completed)
```bash
npm install
```

3. **Build the project** (Already completed)
```bash
npm run build
```

### Running the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on **http://localhost:3000**

### Testing the API

#### 1. Upload an Image
```bash
# Using curl (Windows PowerShell)
curl -X POST http://localhost:3000/api/files/upload `
  -F "file=@path\to\your\image.jpg"

# Using curl (Command Prompt)
curl -X POST http://localhost:3000/api/files/upload ^
  -F "file=@path\to\your\image.jpg"
```

**Expected Response:**
```json
{
  "file_id": "abc123-def456-...",
  "url": "/api/files/abc123-def456-...",
  "size": 345678,
  "mime_type": "image/jpeg",
  "expires_at": "2026-02-15T23:00:00.000Z"
}
```

#### 2. Retrieve an Image
```bash
# In browser
http://localhost:3000/api/files/{file_id}

# Using curl
curl http://localhost:3000/api/files/{file_id} --output downloaded.jpg
```

#### 3. Test File Size Limit (Should Fail - 413 Error)
```bash
# Create a 6MB test file (PowerShell)
$bytes = New-Object byte[] (6 * 1024 * 1024)
[System.IO.File]::WriteAllBytes("large.jpg", $bytes)

# Upload it
curl -X POST http://localhost:3000/api/files/upload `
  -F "file=@large.jpg"
```

**Expected Response:**
```json
{
  "error": "File exceeds maximum size of 5 MB"
}
```

#### 4. Test Invalid File Type (Should Fail - 415 Error)
```bash
# Create a fake image file (PowerShell)
"This is not an image" | Out-File -FilePath fake.jpg

# Upload it
curl -X POST http://localhost:3000/api/files/upload `
  -F "file=@fake.jpg"
```

**Expected Response:**
```json
{
  "error": "Unsupported file type"
}
```

#### 5. Test Deduplication
```bash
# Upload the same file twice
curl -X POST http://localhost:3000/api/files/upload `
  -F "file=@image.jpg"

curl -X POST http://localhost:3000/api/files/upload `
  -F "file=@image.jpg"

# Both should return the same file_id
# Check the uploads/ directory - only one physical file should exist
```

### Running the Cleanup Job

#### Automatic (Scheduled)
The cleanup job runs automatically every hour when the server is running.
It deletes files that have expired (older than 24 hours).

#### Manual Execution
To run cleanup manually:
```bash
npm run cleanup
```

Or with ts-node:
```bash
npx ts-node src/workers/cleanup.ts
```

### Project Structure

```
file upload/
├── src/                        # Source code
│   ├── db/                     # Database layer
│   │   ├── schema.sql          # SQLite schema
│   │   └── index.ts            # Database service
│   ├── services/               # Business logic
│   │   ├── storage.ts          # File storage
│   │   └── upload.ts           # Upload processing
│   ├── routes/                 # API endpoints
│   │   └── files.ts            # File routes
│   ├── utils/                  # Utilities
│   │   └── validation.ts       # File validation
│   ├── workers/                # Background jobs
│   │   └── cleanup.ts          # Cleanup worker
│   ├── app.ts                  # Express app
│   └── server.ts               # Server entry point
├── dist/                       # Compiled JavaScript (created after build)
├── uploads/                    # File storage (created automatically)
├── uploads.db                  # SQLite database (created automatically)
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # Documentation
```

### Verification Checklist

- [x] Build completes without errors
- [ ] Server starts successfully
- [ ] Can upload valid image files (JPEG, PNG, GIF, WEBP)
- [ ] Files > 5MB are rejected with 413 error
- [ ] Invalid file types are rejected with 415 error
- [ ] Duplicate files are deduplicated (same hash)
- [ ] Uploaded files can be retrieved
- [ ] Files are stored in `uploads/` directory
- [ ] Database records are created in `uploads.db`
- [ ] Cleanup job can run manually
- [ ] Files expire after 24 hours

### Monitoring

Watch the console output for:
- **Upload events**: `[Upload] New file saved: {id}`
- **Deduplication**: `[Upload] Deduplicated file: {hash}`
- **Cleanup events**: `[Cleanup] Deleted: {id}`
- **Errors**: `[Error]` prefix

### Security Features Implemented

✅ **File Validation**
- Magic byte signature checking (not just extension)
- Size limit enforcement during streaming
- MIME type verification

✅ **Storage Security**
- Files stored in dedicated directory
- Hash-based filenames (no user input)
- Sanitized original filenames

✅ **HTTP Security**
- Helmet middleware for security headers
- X-Content-Type-Options: nosniff
- Content Security Policy
- Disabled X-Powered-By header

✅ **Path Traversal Protection**
- Filename sanitization
- Absolute path resolution

### Troubleshooting

**Issue: Port 3000 already in use**
```bash
# Set a different port
$env:PORT=3001
npm start
```

**Issue: Database locked**
- Stop all running instances of the server
- Delete `uploads.db` and restart

**Issue: Upload fails with network error**
- Check file size (must be < 5MB)
- Verify file is a valid image format
- Check server logs for errors

### Next Steps

1. Start the server: `npm run dev`
2. Test the upload endpoint with a real image
3. Verify deduplication works
4. Test the cleanup job
5. Monitor logs for any issues

### Production Deployment

For production deployment:
1. Build the project: `npm run build`
2. Use a process manager (PM2): `pm2 start dist/server.js`
3. Setup reverse proxy (nginx) with SSL
4. Configure environment variables
5. Setup monitoring and logging
