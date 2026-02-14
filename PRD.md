# Product Requirements Document (PRD)

## Secure Image Upload System

### 1. Overview

This project implements a secure, efficient file upload system for a document sharing platform suffering from storage exhaustion, security vulnerabilities, and operational instability.

The system must strictly control uploads, prevent malicious files, eliminate duplicates, and automatically clean up expired content.

---

### 2. Goals

* Prevent server crashes due to uncontrolled storage usage
* Accept only safe image formats
* Avoid duplicate storage
* Automatically remove expired files
* Provide clear error messages
* Ensure reliability under concurrent usage

---

### 3. Functional Requirements

#### FR-1: File Size Limit

* Maximum file size: **5 MB**
* Reject files exceeding limit before storage
* Prevent partial writes of oversized uploads

---

#### FR-2: Allowed File Types

Accepted formats:

* JPEG (.jpg, .jpeg)
* PNG (.png)
* GIF (.gif)
* WEBP (.webp)

Validation must use file signature (magic bytes), not only extensions.

---

#### FR-3: Duplicate Detection

* Compute SHA-256 hash of file contents
* Use hash to identify identical files
* If file already exists:

  * Reuse stored object
  * Create new reference only

---

#### FR-4: Storage Rules

* Store files outside executable directories
* Use hash-based or randomized filenames
* Persist metadata in database

Required metadata:

* File ID
* Hash
* Original name
* MIME type
* Size
* Storage path
* Upload time
* Expiration time
* Reference count

---

#### FR-5: Automatic Cleanup

* All uploads expire after **24 hours**
* Cleanup job runs periodically (e.g., hourly)
* Delete files with no active references
* Remove metadata entries as well

---

#### FR-6: Error Handling

Provide clear messages for:

* File too large
* Unsupported file type
* Upload failure
* Server error

Errors must be logged internally.

---

#### FR-7: Successful Upload Response

Return:

* File ID
* Access URL
* File size
* MIME type
* Expiration timestamp

---

### 4. Non-Functional Requirements

#### Security

* Validate file signatures
* Prevent executable content
* Sanitize filenames
* Protect against path traversal
* Serve files with safe headers

#### Reliability

* Must handle concurrent uploads
* Prevent resource exhaustion

#### Performance

* Use streaming uploads
* Avoid loading entire file into memory

#### Scalability

* Support horizontal scaling
* Storage abstraction for future cloud migration

---

### 5. Acceptance Criteria

System must:

1. Reject files > 5 MB
2. Reject non-image files even if renamed
3. Store identical files only once
4. Delete files older than 24 hours automatically
5. Provide clear error messages
6. Maintain server stability

---

End of PRD
