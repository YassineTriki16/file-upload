// Client-side JavaScript for the upload interface

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const fileDetails = document.getElementById('fileDetails');
const filesGrid = document.getElementById('filesGrid');
const uploadAnother = document.getElementById('uploadAnother');
const tryAgain = document.getElementById('tryAgain');

// State
let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderFiles();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Upload another button
    uploadAnother.addEventListener('click', resetUpload);

    // Try again button
    tryAgain.addEventListener('click', resetUpload);
}

// Handle file upload
async function handleFile(file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
        return;
    }

    // Validate file size (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File size exceeds 5 MB limit');
        return;
    }

    // Show progress
    showProgress();

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Upload file
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        // Check if file was deduplicated (same file_id already exists)
        const isDuplicate = uploadedFiles.some(f => f.file_id === data.file_id);

        // Success
        showSuccess(data, file.name, isDuplicate);

        // Save to local storage (only if not duplicate)
        if (!isDuplicate) {
            uploadedFiles.unshift({
                ...data,
                uploadedAt: new Date().toISOString(),
                originalName: file.name
            });

            // Keep only last 20 files
            uploadedFiles = uploadedFiles.slice(0, 20);
            localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));

            // Render files
            renderFiles();
        }

    } catch (error) {
        showError(error.message);
    }
}

// Show progress
function showProgress() {
    dropZone.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    progressContainer.style.display = 'block';

    // Simulate progress (since we don't have real progress tracking)
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 90) {
            progress = 90;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
    }, 200);
}

// Show success
function showSuccess(data, originalName, isDuplicate = false) {
    progressContainer.style.display = 'none';
    successMessage.style.display = 'block';

    // Format file size
    const sizeKB = (data.size / 1024).toFixed(2);
    const sizeMB = (data.size / (1024 * 1024)).toFixed(2);
    const sizeFormatted = data.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    // Format expiration date
    const expiresAt = new Date(data.expires_at);
    const expiresFormatted = expiresAt.toLocaleString();

    // Display file details with deduplication indicator
    fileDetails.innerHTML = `
        ${isDuplicate ? '<div class="dedup-notice" style="background: var(--warning); color: white; padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1rem; text-align: center; font-weight: 600;">⚡ File already exists - Deduplicated!</div>' : ''}
        <div class="file-detail-item">
            <span class="file-detail-label">File Name:</span>
            <span class="file-detail-value">${originalName}</span>
        </div>
        <div class="file-detail-item">
            <span class="file-detail-label">File ID:</span>
            <span class="file-detail-value">${data.file_id.substring(0, 16)}...</span>
        </div>
        <div class="file-detail-item">
            <span class="file-detail-label">Size:</span>
            <span class="file-detail-value">${sizeFormatted}</span>
        </div>
        <div class="file-detail-item">
            <span class="file-detail-label">Type:</span>
            <span class="file-detail-value">${data.mime_type}</span>
        </div>
        <div class="file-detail-item">
            <span class="file-detail-label">Expires:</span>
            <span class="file-detail-value">${expiresFormatted}</span>
        </div>
        <div class="file-detail-item">
            <span class="file-detail-label">URL:</span>
            <span class="file-detail-value">
                <a href="${data.url}" target="_blank" style="color: var(--primary);">${data.url}</a>
            </span>
        </div>
    `;
}

// Show error
function showError(message) {
    progressContainer.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;
}

// Reset upload
function resetUpload() {
    dropZone.style.display = 'block';
    progressContainer.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    fileInput.value = '';
    progressFill.style.width = '0%';
}

// Render uploaded files
function renderFiles() {
    if (uploadedFiles.length === 0) {
        filesGrid.innerHTML = '<p class="empty-state">No files uploaded yet</p>';
        return;
    }

    filesGrid.innerHTML = uploadedFiles.map(file => {
        const uploadedAt = new Date(file.uploadedAt);
        const expiresAt = new Date(file.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;

        const sizeKB = (file.size / 1024).toFixed(2);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const sizeFormatted = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

        const timeAgo = getTimeAgo(uploadedAt);

        return `
            <div class="file-card ${isExpired ? 'expired' : ''}">
                <img src="${file.url}" alt="${file.originalName}" class="file-image" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23cbd5e1%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3Ccircle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/%3E%3Cpolyline points=%2221 15 16 10 5 21%22/%3E%3C/svg%3E'">
                <div class="file-info">
                    <div class="file-name" title="${file.originalName}">${file.originalName}</div>
                    <div class="file-meta">
                        <span>${sizeFormatted}</span>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="file-actions">
                        <button class="btn-delete" onclick="deleteFile('${file.file_id}')" ${isExpired ? 'disabled' : ''}>
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Delete file
async function deleteFile(fileId) {
    console.log('[Delete] Attempting to delete file:', fileId);

    if (!confirm('Are you sure you want to delete this file?')) {
        console.log('[Delete] User cancelled deletion');
        return;
    }

    try {
        console.log('[Delete] Sending DELETE request to:', `/api/files/${fileId}`);

        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        });

        console.log('[Delete] Response status:', response.status);

        const data = await response.json();
        console.log('[Delete] Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Delete failed');
        }

        // Remove from local storage
        uploadedFiles = uploadedFiles.filter(f => f.file_id !== fileId);
        localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));

        // Re-render files
        renderFiles();

        // Show success toast
        showToast('File deleted successfully', 'success');
        console.log('[Delete] File deleted successfully');
    } catch (error) {
        console.error('[Delete] Error:', error);
        showToast(error.message, 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        animation: fadeIn 0.3s ease;
        z-index: 1000;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Clean up expired files from local storage periodically
setInterval(() => {
    const now = new Date();
    uploadedFiles = uploadedFiles.filter(file => {
        const expiresAt = new Date(file.expires_at);
        return expiresAt > now;
    });
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    renderFiles();
}, 60000); // Check every minute
