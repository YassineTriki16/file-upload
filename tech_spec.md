# Technical Specification

## 1. Hashing

Algorithm: SHA-256

Used for:

* Deduplication
* Filename generation
* Integrity verification

---

## 2. Validation Rules

### Size

* Max 5 MB

### Type

Verify using magic bytes:

* JPEG: FF D8 FF
* PNG: 89 50 4E 47
* GIF: 47 49 46 38
* WEBP: RIFF....WEBP

---

## 3. Streaming Upload

Implementation must:

* Process data in chunks
* Avoid full memory buffering
* Compute hash while writing

---

## 4. Database Schema (Conceptual)

### Files Table

* id (PK)
* hash (unique)
* storage_path
* size
* mime_type
* created_at
* expires_at
* reference_count

### Upload References Table (optional)

* id
* file_id (FK)
* uploaded_at

---

## 5. Cleanup Process

Interval: hourly

Steps:

1. Query expired files
2. Verify reference count
3. Delete storage object
4. Remove DB records

Must tolerate crashes and restarts.

---

End of Technical Specification
