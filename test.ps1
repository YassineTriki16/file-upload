# Test Script for Secure Image Upload System
# Run this after starting the server with: npm run dev

Write-Host "=== Secure Image Upload System - Test Script ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "[Test 1] Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Server is running" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Server is not running. Please start it with 'npm run dev'" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Create a test image (1x1 PNG)
Write-Host "[Test 2] Creating test image..." -ForegroundColor Yellow
$pngBytes = @(
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
)
[System.IO.File]::WriteAllBytes("test-image.png", $pngBytes)
Write-Host "✓ Created test-image.png" -ForegroundColor Green

Write-Host ""

# Test 3: Upload valid image
Write-Host "[Test 3] Uploading valid image..." -ForegroundColor Yellow
try {
    $form = @{
        file = Get-Item -Path "test-image.png"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/files/upload" -Method Post -Form $form
    Write-Host "✓ Upload successful" -ForegroundColor Green
    Write-Host "  File ID: $($response.file_id)" -ForegroundColor Gray
    Write-Host "  Size: $($response.size) bytes" -ForegroundColor Gray
    Write-Host "  MIME Type: $($response.mime_type)" -ForegroundColor Gray
    Write-Host "  Expires: $($response.expires_at)" -ForegroundColor Gray
    $fileId = $response.file_id
} catch {
    Write-Host "✗ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Retrieve uploaded file
if ($fileId) {
    Write-Host "[Test 4] Retrieving uploaded file..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "$baseUrl/api/files/$fileId" -OutFile "downloaded.png"
        Write-Host "✓ File retrieved successfully (saved as downloaded.png)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Upload duplicate (should deduplicate)
Write-Host "[Test 5] Uploading duplicate file (testing deduplication)..." -ForegroundColor Yellow
try {
    $form = @{
        file = Get-Item -Path "test-image.png"
    }
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/files/upload" -Method Post -Form $form
    Write-Host "✓ Upload successful" -ForegroundColor Green
    Write-Host "  File ID: $($response2.file_id)" -ForegroundColor Gray
    
    if ($response2.file_id -eq $fileId) {
        Write-Host "✓ Deduplication working! Same file ID returned" -ForegroundColor Green
    } else {
        Write-Host "⚠ Different file ID returned (deduplication may not be working)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Upload invalid file type
Write-Host "[Test 6] Uploading invalid file type (should fail with 415)..." -ForegroundColor Yellow
"This is not an image" | Out-File -FilePath "fake.jpg" -Encoding ASCII
try {
    $form = @{
        file = Get-Item -Path "fake.jpg"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/files/upload" -Method Post -Form $form
    Write-Host "✗ Upload should have failed but succeeded" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 415) {
        Write-Host "✓ Correctly rejected invalid file type (415)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Failed with unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 7: Upload oversized file
Write-Host "[Test 7] Uploading oversized file (should fail with 413)..." -ForegroundColor Yellow
$largeBytes = New-Object byte[] (6 * 1024 * 1024)  # 6 MB
# Add PNG signature to make it pass type check
$largeBytes[0] = 0x89
$largeBytes[1] = 0x50
$largeBytes[2] = 0x4E
$largeBytes[3] = 0x47
[System.IO.File]::WriteAllBytes("large.png", $largeBytes)

try {
    $form = @{
        file = Get-Item -Path "large.png"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/files/upload" -Method Post -Form $form
    Write-Host "✗ Upload should have failed but succeeded" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 413) {
        Write-Host "✓ Correctly rejected oversized file (413)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Failed with unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Cleanup test files
Write-Host "Cleaning up test files..." -ForegroundColor Gray
Remove-Item -Path "test-image.png" -ErrorAction SilentlyContinue
Remove-Item -Path "downloaded.png" -ErrorAction SilentlyContinue
Remove-Item -Path "fake.jpg" -ErrorAction SilentlyContinue
Remove-Item -Path "large.png" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the uploads/ directory to see stored files" -ForegroundColor Gray
Write-Host "Check uploads.db to see database records" -ForegroundColor Gray
