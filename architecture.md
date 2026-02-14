# System Architecture — Secure Upload Service

## 1. High-Level Architecture

Components:

1. Upload API Endpoint
2. Validation Layer
3. Hash Computation Module
4. Storage Layer
5. Metadata Database
6. Cleanup Worker
7. File Serving Endpoint

---

## 2. Upload Flow

1. Client sends multipart upload request
2. Server streams file
3. Size validation enforced
4. File signature verified
5. SHA-256 hash computed during streaming
6. Check database for existing hash
7. Store file if new
8. Create reference entry
9. Return response

---

## 3. Storage Strategy

Preferred: Object storage (S3-compatible)

Fallback: Local disk with dedicated directory

Filename format:

* `<hash>.<extension>`

Files must not be executable.

---

## 4. Metadata Database

Stores file information separate from storage.

Key responsibilities:

* Deduplication tracking
* Expiration management
* Reference counting
* Retrieval mapping

---

## 5. Cleanup Worker

Runs periodically to:

* Find expired files
* Check reference count
* Delete storage objects safely
* Remove database records

Must be idempotent and fault-tolerant.

---

## 6. File Serving

Files served via controlled endpoint:

* Validate file exists
* Set safe headers
* Prevent MIME sniffing
* Optionally force download

---

## 7. Security Controls

* Input validation
* Safe storage paths
* Rate limiting (optional)
* Logging and monitoring

---

End of Architecture Document
