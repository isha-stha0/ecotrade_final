# Cloudinary Integration - Verification Checklist

Use this checklist to verify that the Cloudinary integration is working correctly.

## Pre-Setup

- [ ] Create Cloudinary account at https://cloudinary.com
- [ ] Get Cloud Name, API Key, and API Secret from Settings > API Keys
- [ ] Add credentials to `.env` file in backend directory:
  ```env
  CLOUDINARY_CLOUD_NAME=your_value
  CLOUDINARY_API_KEY=your_value
  CLOUDINARY_API_SECRET=your_value
  ```

## Backend Verification

### 1. Server Startup

```bash
cd backend
npm install
npm run dev
```

- [ ] Server starts without errors
- [ ] Check console: "✅ MongoDB Connected" and "🚀 Server running on port 5000"

### 2. Cloudinary Configuration Check

```bash
# Check if Cloudinary is detected as configured
curl http://localhost:5000/api/health
```

- [ ] Response shows `{"status":"OK"}`
- [ ] No errors in console about Cloudinary

### 3. File Upload Validation

Test file size validation:
```bash
# Create a test file > 5MB
fallocate -l 6M test_large.jpg  # Linux/Mac: dd if=/dev/zero of=test_large.jpg bs=1M count=6

# Try uploading (should fail with 413)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <admin_token>" \
  -F "name=Test" \
  -F "description=Test" \
  -F "category=Test" \
  -F "price=100" \
  -F "stock=10" \
  -F "image_urls=@test_large.jpg"
```

- [ ] Returns 413 error with message about file size

Test file type validation:
```bash
# Create a test text file with .jpg extension
echo "not an image" > fake.jpg

# Try uploading (should fail with 400)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <admin_token>" \
  -F "name=Test" \
  -F "description=Test" \
  -F "category=Test" \
  -F "price=100" \
  -F "stock=10" \
  -F "image_urls=@fake.jpg"
```

- [ ] Returns 400 error with message about file type

Test valid upload:
```bash
# Create a valid test image (use real PNG/JPG)
# Upload should succeed
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <admin_token>" \
  -F "name=Test Product" \
  -F "description=A test product" \
  -F "category=Stationery" \
  -F "price=100" \
  -F "stock=10" \
  -F "image_urls=@real_image.jpg"
```

- [ ] Returns 201 status
- [ ] Response includes `image_urls` array with Cloudinary URL

## Admin Panel Verification (React)

### 1. Setup & Start

```bash
cd admin
npm install
npm run dev
```

- [ ] Admin panel loads on http://localhost:5173
- [ ] Can login as admin

### 2. Product Form Validation

Navigate to Products > Add New Product:

- [ ] File input shows "PNG, JPG only • Max 5MB each • Up to 5 images"
- [ ] Try selecting non-image file
  - [ ] Gets error alert about file type
- [ ] Try selecting > 5MB image
  - [ ] Gets error alert about file size
- [ ] Try selecting 6 images
  - [ ] Gets error about maximum 5 images
  - [ ] Only 5 images retained

### 3. Image Preview

- [ ] Selected images show in preview grid
- [ ] Each image has remove button (X)
- [ ] Clicking remove deletes from preview

### 4. Successful Product Upload

- [ ] Select 1-5 valid PNG/JPG images
- [ ] Fill in product details
- [ ] Click "Create Product"
- [ ] Product created successfully
- [ ] Check Products list - product appears with images displayed

## Flutter App Verification

### 1. Setup & Build

```bash
cd ecotrade_flutter
flutter pub get
flutter run
```

- [ ] No dependency errors
- [ ] `image_picker: ^1.0.0` installed successfully
- [ ] App compiles and runs

### 2. Scrap Submission Screen

Navigate to Scrap Submission:

- [ ] See "Photos (PNG, JPG • Max 5MB each • Up to 5 images)" label
- [ ] See green image upload box
- [ ] Shows "Tap to add photos (0/5)"

### 3. Image Selection & Validation

- [ ] Tap image upload box
- [ ] Image picker opens (gallery/camera options)
- [ ] Select a PNG or JPG image
- [ ] Image appears in grid below upload box
- [ ] Counter shows "(1/5)"

### 4. File Validation

- [ ] Try selecting > 5MB image
  - [ ] Gets SnackBar error: "Image size must be less than 5MB"
- [ ] Try selecting non-image file
  - [ ] Gets SnackBar error: "Only PNG and JPG files are allowed"
- [ ] Try selecting 6 images total
  - [ ] Gets error about max 5 images
  - [ ] Only 5 total retained

### 5. Image Management

- [ ] Selected images show thumbnails in grid
- [ ] Each thumbnail has X button
- [ ] Clicking X removes that image from grid
- [ ] Counter updates as images added/removed

### 6. Scrap Submission with Photos

- [ ] Fill in scrap details (category, description, quantity, location)
- [ ] Select 1-5 images
- [ ] Tap "Submit Scrap Request"
- [ ] See loading indicator
- [ ] Get success SnackBar: "Scrap submitted! Awaiting approval 🌱"
- [ ] Form clears (including images)
- [ ] Check backend logs - multipart request received
- [ ] Check Cloudinary dashboard - images appear in ecotrade folder

### 7. Scrap Submission without Photos

- [ ] Fill in scrap details only
- [ ] Don't select any images
- [ ] Tap "Submit Scrap Request"
- [ ] Submit succeeds (photos optional)
- [ ] Scrap created without photos

## Integration Verification

### 1. Cross-Platform Image Display

- [ ] Admin creates product with images ✓
- [ ] Products API returns image URLs ✓
- [ ] Product list displays images correctly ✓
- [ ] User/Flutter app can see products with images ✓

### 2. Scrap Image Flow

- [ ] Flutter app submits scrap with photos ✓
- [ ] Backend receives and uploads to Cloudinary ✓
- [ ] Admin can view scrap request with photos ✓
- [ ] Photos display correctly in scrap details ✓

### 3. Product Listing

In any product list (mobile/web):

- [ ] Products display with thumbnail images
- [ ] Images load from Cloudinary URLs
- [ ] Images show correctly on slow networks
- [ ] No broken image links (404s)

## Error Recovery Testing

### 1. Network Interruption

- [ ] Start product upload
- [ ] Disconnect network
- [ ] See error message
- [ ] Error message is user-friendly
- [ ] Can retry after reconnecting

### 2. Cloudinary Down Scenario

(Only if testing with Cloudinary credentials)

- [ ] Disable Cloudinary credentials in .env
- [ ] Try uploading
- [ ] Falls back to local storage
- [ ] Files still validate and upload
- [ ] Files served from `/uploads/` path

### 3. Invalid Credentials

- [ ] Use wrong Cloudinary credentials
- [ ] Try uploading
- [ ] Gets appropriate error message
- [ ] Error logged in console
- [ ] Doesn't crash app

## Performance Verification

- [ ] Product creation with 5 images completes in < 10 seconds
- [ ] Scrap submission with photos completes in < 10 seconds
- [ ] Images load in product listing within 2-3 seconds
- [ ] No timeout errors on normal network

## Security Verification

- [ ] Cloudinary credentials in .env, not in code
- [ ] `.gitignore` includes .env file
- [ ] No tokens exposed in browser console
- [ ] File uploads require authentication (backend validates)
- [ ] File type validation prevents script execution
- [ ] File size limit prevents abuse

## Database Verification

- [ ] Products with image URLs stored in MongoDB
- [ ] Scrap requests with photo URLs stored in MongoDB
- [ ] URLs persist after app restart
- [ ] Multiple products/scraps can have different images

## Cleanup

- [ ] Delete test images from local system
- [ ] Delete test files from Cloudinary dashboard (if desired)
- [ ] Remove test credentials from notes

## Final Sign-Off

- [ ] All checkboxes above are checked ✓
- [ ] No errors in console logs ✓
- [ ] All features working as documented ✓
- [ ] Ready for production deployment ✓

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Only PNG and JPG" error for valid images | Check file MIME type, re-save image |
| "File size" error for small images | Check actual file size on disk |
| Images not appearing on page | Check Cloudinary URL format, ensure credentials valid |
| Upload fails silently | Check network tab in DevTools, check backend logs |
| Server won't start | Verify MongoDB connection, check .env file |

---

## Support Resources

- Backend error handling: `backend/routes/products.js` and `backend/routes/scrap.js`
- File validation config: `backend/utils/cloudinary.js`
- Admin validation: `admin/src/pages/ProductForm.jsx`
- Flutter validation: `ecotrade_flutter/lib/screens/scrap/submit_scrap_screen.dart`
- Setup guide: `CLOUDINARY_SETUP.md`
