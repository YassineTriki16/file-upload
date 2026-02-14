# API Specification — Upload Service

## Base Endpoint

`/api/files`

---

## 1. Upload File

### POST /api/files/upload

Upload a single image file.

#### Request

Content-Type: multipart/form-data

Field:

* `file` — binary file data

---

#### Success Response (200)

```json
{
  "file_id": "abc123",
  "url": "/api/files/abc123",
  "size": 345678,
  "mime_type": "image/png",
  "expires_at": "2026-02-15T12:00:00Z"
}
```

---

#### Error Responses

**413 Payload Too Large**

```json
{
  "error": "File exceeds maximum size of 5 MB"
}
```

**415 Unsupported Media Type**

```json
{
  "error": "Unsupported file type"
}
```

**500 Server Error**

```json
{
  "error": "Upload failed due to server error"
}
```

---

## 2. Retrieve File

### GET /api/files/{file_id}

Returns file content if not expired.

---

#### Not Found (404)

```json
{
  "error": "File not found or expired"
}
```

---

End of API Specification
