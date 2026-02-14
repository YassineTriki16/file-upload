# 🚀 Secure Image Upload System

A production-grade secure image upload system with streaming uploads, SHA-256 deduplication, automatic cleanup, and a beautiful web interface.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## ✨ Features

### 🔒 Security
- **Magic byte validation** - Validates actual file content, not just extensions
- **Streaming uploads** - No memory buffering, handles large files safely
- **5MB size limit** - Enforced during streaming to prevent abuse
- **Path traversal protection** - Sanitized filenames and absolute paths
- **Security headers** - Helmet middleware with CSP, MIME sniffing prevention
- **No executable content** - Files stored with safe extensions in non-executable directories

### 🎯 Core Functionality
- **SHA-256 deduplication** - Identical files stored only once
- **Reference counting** - Tracks file usage across multiple uploads
- **24-hour auto-expiration** - Files automatically deleted after 24 hours
- **Hourly cleanup worker** - Automated cleanup with cron scheduling
- **RESTful API** - Upload, retrieve, and delete endpoints
- **File metadata storage** - SQLite database with WAL mode for concurrency

### 🎨 Web Interface
- **Drag & drop upload** - Modern, intuitive file upload
- **Real-time progress** - Animated progress tracking
- **File gallery** - View recently uploaded files with thumbnails
- **Deduplication indicator** - Visual feedback when files are deduplicated
- **Delete functionality** - Remove files with confirmation
- **Responsive design** - Works on desktop, tablet, and mobile
- **Dark theme** - Beautiful gradient design with smooth animations

### ⚡ Performance
- **Streaming architecture** - Memory-efficient file processing
- **SQLite with WAL** - Fast, concurrent database access
- **Hash-based storage** - Efficient file organization
- **Automatic cleanup** - Prevents storage bloat

## 📋 Requirements

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd file-upload
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the project
```bash
npm run build
```

### 4. Start the server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 5. Open the web interface
Navigate to: **http://localhost:3000**

## 📁 Project Structure

```
file-upload/
├── src/
│   ├── db/
│   │   ├── schema.sql          # Database schema
│   │   └── index.ts            # Database service
│   ├── services/
│   │   ├── storage.ts          # Storage abstraction
│   │   └── upload.ts           # Upload processing
│   ├── routes/
│   │   └── files.ts            # API endpoints
│   ├── utils/
│   │   └── validation.ts       # File validation
│   ├── workers/
│   │   └── cleanup.ts          # Cleanup worker
│   ├── app.ts                  # Express app
│   └── server.ts               # Server entry point
├── public/                     # Web interface
│   ├── index.html              # Upload page
│   ├── styles.css              # Modern CSS
│   └── app.js                  # Client-side JS
├── uploads/                    # File storage (auto-created)
├── package.json
├── tsconfig.json
└── uploads.db                  # SQLite database (auto-created)
```

## 🔌 API Endpoints

### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

Response (200):
{
  "file_id": "abc123-def456-...",
  "url": "/api/files/abc123-def456-...",
  "size": 345678,
  "mime_type": "image/png",
  "expires_at": "2026-02-15T12:00:00Z"
}
```

### Retrieve File
```http
GET /api/files/:id

Response: File content with appropriate headers
```

### Delete File
```http
DELETE /api/files/:id

Response (200):
{
  "message": "File deleted successfully"
}
```

### Health Check
```http
GET /health

Response (200):
{
  "status": "ok",
  "timestamp": "2026-02-14T12:00:00Z"
}
```

## 🧪 Testing

### Run automated tests
```bash
.\test.ps1
```

### Manual testing
```bash
# Upload a file
curl -X POST http://localhost:3000/api/files/upload -F "file=@image.jpg"

# Retrieve a file
curl http://localhost:3000/api/files/{file_id} --output downloaded.jpg

# Delete a file
curl -X DELETE http://localhost:3000/api/files/{file_id}
```

### Run cleanup manually
```bash
npm run cleanup
```

## 🛡️ Security Features

1. **File Validation**
   - Magic byte signature checking (JPEG, PNG, GIF, WEBP)
   - Size limit enforcement during streaming
   - MIME type verification

2. **Storage Security**
   - Files stored outside executable directories
   - Hash-based filenames (no user input)
   - Sanitized original filenames

3. **HTTP Security**
   - Helmet middleware for security headers
   - X-Content-Type-Options: nosniff
   - Content Security Policy
   - Disabled X-Powered-By header

4. **Path Traversal Protection**
   - Filename sanitization
   - Absolute path resolution

## ⚙️ Configuration

Environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## 📊 Database Schema

```sql
CREATE TABLE files (
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
```

## 🚢 Production Deployment

### 1. Build the project
```bash
npm run build
```

### 2. Set environment variables
```bash
export PORT=3000
export NODE_ENV=production
```

### 3. Run with PM2
```bash
npm install -g pm2
pm2 start dist/server.js --name "upload-service"
pm2 save
pm2 startup
```

### 4. Setup reverse proxy (nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 5M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run cleanup` - Run cleanup worker manually

## 🎨 Web Interface Features

- **Drag & Drop** - Drag files directly onto the upload zone
- **Progress Tracking** - Real-time upload progress
- **File Gallery** - View recently uploaded files
- **Deduplication Warning** - Visual indicator when files are deduplicated
- **Delete Button** - Remove files with confirmation
- **Responsive Design** - Mobile-friendly interface
- **Dark Theme** - Modern gradient design
- **Smooth Animations** - Polished user experience

## 🔍 Monitoring

Logs include:
- Request logging (method, path, status, duration)
- Upload events (new files, deduplication)
- Cleanup events (expired files deleted)
- Error logging

## 📚 Documentation

- `README.md` - This file
- `SETUP_GUIDE.md` - Detailed setup instructions
- `IMPLEMENTATION.md` - Technical implementation details
- `PROJECT_OVERVIEW.md` - Complete project overview
- `WEB_INTERFACE.md` - Web interface documentation
- `QUICK_TEST.md` - Quick testing guide

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC

## 🙏 Acknowledgments

Built with:
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **SQLite** - Embedded database
- **Busboy** - Multipart form data parsing
- **Helmet** - Security middleware

---

**Made with ❤️ for secure file uploads**
# file-upload
