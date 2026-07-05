# Cloudinary Integration Setup Guide

This document explains how to configure and use Cloudinary for image uploads in the EcoTrade application.

## Overview

EcoTrade uses Cloudinary as the cloud storage provider for all image uploads. This includes:
- Product images (admin upload)
- Scrap request photos (user/Flutter submission)

**File Restrictions:**
- Maximum file size: **5MB per image**
- Allowed formats: **PNG, JPG/JPEG only**
- Maximum images per upload: **5 images**

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Getting Cloudinary Credentials

1. Sign up at [Cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Navigate to Settings > API Keys
4. Copy your:
   - Cloud Name
   - API Key
   - API Secret

### 3. How It Works

**File Validation (Backend - `utils/cloudinary.js`):**
- File size validation: Multer checks file size before upload
- File type validation: Only PNG and JPG MIME types are allowed
- Cloudinary storage: Automatically uploads to your Cloudinary account
- URL Generation: Files are stored in the `ecotrade` folder on Cloudinary

**Error Handling:**
- Upload errors are caught and returned as JSON responses
- 413 error: File too large (>5MB)
- 400 error: Invalid file type (not PNG/JPG)

## Admin Panel (React) - Product Upload

### Features

- **File Validation:**
  - Checks file type (PNG/JPG only)
  - Checks file size (5MB limit)
  - Limits to 5 images per product

- **File Picker:**
  - Multi-select support
  - Image preview grid
  - Remove images before submission
  - File size and type info in label

### Usage

```javascript
// In ProductForm.jsx
// Files are validated on selection
// Valid files show preview thumbnails
// Remove button deletes from preview
// Submit sends FormData with files to backend
```

## Flutter App - Scrap Submission

### Features

- **Image Picker:**
  - Gallery access to select images
  - MIME type detection
  - File size validation

- **Validation:**
  - 5MB file size limit
  - PNG/JPG only
  - Maximum 5 images per request
  - User-friendly error messages

### Usage

```dart
// In submit_scrap_screen.dart
// Tap image icon to select photos
// Selected photos show in grid with removal option
// Photos are automatically included in scrap submission
// Photos optional - submission works without them
```

### Configuration

`image_picker: ^1.0.0` is included in `pubspec.yaml`

## API Endpoints

### Product Upload

**Endpoint:** `POST /api/products`

```javascript
// FormData structure
{
  'name': 'Product Name',
  'description': 'Product description',
  'category': 'Stationery',
  'price': 150,
  'stock': 50,
  'madeFrom': 'Recycled Paper',
  'ecoImpact': 'Saves 2kg CO2',
  'image_urls': [File, File, ...] // Up to 5 files
}
```

**Response:** Returns product with `image_urls` array containing Cloudinary URLs

### Scrap Submission

**Endpoint:** `POST /api/scrap`

```javascript
// FormData structure
{
  'category': 'paper',
  'description': 'Old newspapers and cardboard',
  'quantity': 10,
  'location': 'Address',
  'photos': [File, File, ...] // Up to 5 files (optional)
}
```

**Response:** Returns scrap request with `photos` array containing Cloudinary URLs

## Error Handling

### Backend Error Responses

```javascript
// File too large
{
  "message": "File size must be less than 5MB"
  // Status: 413
}

// Invalid file type
{
  "message": "Only PNG and JPG files are allowed"
  // Status: 400
}

// General upload error
{
  "message": "File upload error"
  // Status: 400
}
```

### Frontend Error Handling

**React (Admin):**
- Validation errors show in `alert()` dialogs
- User-friendly messages about file size and type

**Flutter:**
- Errors show in SnackBar notifications
- Bottom sheet displays specific issues

## Fallback: Local Storage

If Cloudinary credentials are not configured:
- Backend falls back to local disk storage
- Files stored in `/backend/uploads/`
- Files served via `/uploads/` static route
- All validation still applies

## Troubleshooting

### "Only PNG and JPG files are allowed"

**Cause:** Trying to upload unsupported format (WEBP, GIF, etc.)

**Solution:**
- Convert image to PNG or JPG
- Use online converter if needed

### "File size must be less than 5MB"

**Cause:** Image file exceeds 5MB limit

**Solution:**
- Compress image using:
  - Online tools (TinyPNG, Compressor.io)
  - Mobile/desktop apps (ImageMagick, etc.)
- Or reduce resolution/dimensions

### Images not appearing

**Cause:** Upload failed silently or Cloudinary URL not returned

**Solution:**
- Check browser console for errors
- Verify Cloudinary credentials in `.env`
- Check network tab in browser DevTools
- Ensure file was actually uploaded

### "Cannot reach server"

**Cause:** Backend not running or API URL incorrect

**Solution:**
- Start backend: `npm run dev` in `/backend`
- Check API base URL in config
- Verify network connectivity

## Development Tips

### Testing Image Upload

```bash
# Test with curl
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>" \
  -F "name=Test Product" \
  -F "description=Test" \
  -F "category=Test" \
  -F "price=100" \
  -F "stock=10" \
  -F "image_urls=@/path/to/image.jpg"
```

### Viewing Uploaded Images

Cloudinary URLs have format:
```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/ecotrade/{filename}
```

### Disabling Cloudinary (Local Development)

Comment out Cloudinary env vars to use local storage:
```env
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
```

## Best Practices

1. **Validate file size and type on both frontend and backend**
2. **Always compress images before upload**
3. **Test upload functionality with various file sizes**
4. **Monitor Cloudinary usage to avoid exceeding quotas**
5. **Cache image URLs to reduce API calls**
6. **Use responsive images for different screen sizes**

## Security Considerations

- Cloudinary credentials stored in `.env` (never commit)
- File type validation prevents malicious uploads
- File size limit prevents abuse/storage exhaustion
- Backend validation independent of frontend
- All uploads require authentication

## Support

For Cloudinary-specific issues, visit:
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Cloudinary Support](https://support.cloudinary.com)

For EcoTrade integration issues, contact the development team.
