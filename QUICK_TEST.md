# Quick Test Guide - Secure Image Upload System

## ✅ Server is Running!

Your server is now running at: **http://localhost:3000**

---

## 🧪 Quick Tests

### Test 1: Access the Web Interface
1. Open your browser
2. Go to: `http://localhost:3000`
3. You should see the beautiful upload interface

### Test 2: Upload a Valid Image
1. Find any image file on your computer (JPEG, PNG, GIF, or WEBP)
2. Drag it onto the upload zone OR click to browse
3. **Expected**: Upload completes quickly, shows success message with file details

### Test 3: Test File Size Limit (PowerShell)
```powershell
# Create a 6MB test file
$bytes = New-Object byte[] (6 * 1024 * 1024)
$bytes[0] = 0x89; $bytes[1] = 0x50; $bytes[2] = 0x4E; $bytes[3] = 0x47  # PNG signature
[System.IO.File]::WriteAllBytes("large.png", $bytes)

# Try to upload it (should fail with 413)
curl -X POST http://localhost:3000/api/files/upload -F "file=@large.png"
```
**Expected**: `{"error":"File exceeds maximum size of 5 MB"}`

### Test 4: Test Magic Byte Validation (PowerShell)
```powershell
# Create a fake image (text file with .jpg extension)
"This is not an image" | Out-File -FilePath fake.jpg -Encoding ASCII

# Try to upload it (should fail with 415)
curl -X POST http://localhost:3000/api/files/upload -F "file=@fake.jpg"
```
**Expected**: `{"error":"Unsupported file type"}`

### Test 5: Test Deduplication
1. Upload the same image twice through the web interface
2. Note the File ID from the first upload
3. Upload the exact same file again
4. **Expected**: You get the SAME File ID back
5. Check `uploads/` folder - only ONE file should exist

### Test 6: Verify File Storage
```powershell
# List files in uploads directory
Get-ChildItem "C:\Users\yassi\Desktop\file upload\uploads"
```
**Expected**: Files named like `abc123def456...xyz.jpg` (SHA-256 hash + extension)

### Test 7: Manual Cleanup Test
```powershell
# Run cleanup worker
npm run cleanup
```
**Expected**: Console shows `[Cleanup] No expired files found` (since files are < 24 hours old)

---

## 🎯 Success Indicators

| Feature | How to Verify |
|---------|---------------|
| **Web Interface** | You see the upload page at `http://localhost:3000` |
| **Upload Works** | Files upload quickly and show success message |
| **Size Limit** | 6MB file rejected with "File exceeds maximum size" |
| **Type Validation** | Fake .jpg rejected with "Unsupported file type" |
| **Deduplication** | Same file uploaded twice = same File ID |
| **Storage** | Files stored in `uploads/` with hash-based names |
| **Gallery** | Recent uploads appear in the gallery section |

---

## 📊 Check Server Logs

Your terminal should show:
```
[DB] Database initialized
[Server] Secure Image Upload Service running on port 3000
[2026-02-14T...] POST /api/files/upload 200 - 45ms
[Upload] New file stored: abc123... (123456 bytes)
```

---

## 🐛 Troubleshooting

**Problem**: Upload stays at "Uploading..." forever
- **Solution**: Check server logs for errors. The fix I just applied should resolve this.

**Problem**: 404 error when accessing http://localhost:3000
- **Solution**: Make sure `public/` folder exists with `index.html`, `styles.css`, `app.js`

**Problem**: "Unsupported file type" for valid images
- **Solution**: Make sure the file is actually an image (not renamed text file)

**Problem**: Can't see uploaded files in gallery
- **Solution**: Files are stored in localStorage. Try refreshing the page after upload.

---

## 🎨 What to Expect

1. **Beautiful UI**: Dark theme with purple gradients and smooth animations
2. **Drag & Drop**: Drag files directly onto the upload zone
3. **Progress Bar**: Animated progress during upload
4. **Success Screen**: Shows file details (ID, size, type, expiration, URL)
5. **Gallery**: Grid of recently uploaded images with thumbnails
6. **Copy Link**: One-click to copy file URL to clipboard

---

## ✨ The upload should now work instantly!

Try uploading an image now through the web interface at:
**http://localhost:3000**

If you see any errors, check the server terminal for detailed logs.
