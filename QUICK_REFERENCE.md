# Cloudinary Integration - Quick Reference

## 🚀 Quick Start

### 1. Get Cloudinary Credentials
- Visit https://cloudinary.com
- Sign up (free account available)
- Dashboard → Settings → API Keys
- Copy: Cloud Name, API Key, API Secret

### 2. Configure Backend
```bash
cd backend
# Edit .env file and add:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Setup Flutter App
```bash
cd ecotrade_flutter
flutter pub get
```

### 4. Start All Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Admin
cd admin && npm run dev

# Terminal 3: Flutter
cd ecotrade_flutter && flutter run
```

## 📋 File Upload Specifications

| Aspect | Specification |
|--------|--------------|
| Max File Size | 5 MB |
| Allowed Formats | PNG, JPG/JPEG |
| Max Images Per Upload | 5 |
| Storage Location | Cloudinary (cloud) |
| Fallback Storage | Local `/uploads/` folder |

## 🔧 Implementation Locations

### Backend Validation
- **File:** `backend/utils/cloudinary.js`
- **Validation:** File size + type checks
- **Max Size:** 5MB
- **Allowed Types:** PNG, JPG

### Admin Product Upload
- **File:** `admin/src/pages/ProductForm.jsx`
- **Feature:** Image preview grid
- **Validation:** On file selection
- **Max Images:** 5

### Flutter Scrap Submission  
- **File:** `ecotrade_flutter/lib/screens/scrap/submit_scrap_screen.dart`
- **Feature:** Image picker from gallery
- **Validation:** MIME type + file size
- **Optional:** Photos not required

### API Endpoints
- Product Upload: `POST /api/products`
- Scrap Upload: `POST /api/scrap`
- Both use multipart form data

## ✅ What's Included

- ✅ Backend file validation (size + type)
- ✅ Admin panel image upload with preview
- ✅ Flutter image picker integration
- ✅ Error handling for all scenarios
- ✅ User-friendly error messages
- ✅ Documentation (3 guides)
- ✅ Verification checklist
- ✅ Fallback to local storage

## 🐛 Common Issues & Fixes

### "Only PNG and JPG allowed"
→ File is not actually PNG/JPG
→ Try converting with online tool or image editor

### "File size must be less than 5MB"  
→ Image file is too large
→ Compress using: TinyPNG, Compressor.io, or ImageMagick

### "Cannot reach server"
→ Backend not running
→ Start with: `npm run dev` in backend folder

### Images not showing
→ Cloudinary credentials missing or wrong
→ Check .env file has correct values
→ Verify Cloud Name matches Cloudinary dashboard

### Upload fails with no message
→ Check browser console (DevTools → Console)
→ Check backend logs for error details

## 📱 Where to Upload

### Admin Panel
1. Go to Products page
2. Click "Add New Product"
3. Scroll to "Product Images" section
4. Click upload box
5. Select PNG/JPG images (max 5)
6. Submit form

### Flutter App
1. Open Scrap Submission
2. Fill in details (category, description, etc.)
3. Scroll to "Photos" section
4. Tap green image box
5. Select photos from gallery
6. Remove any if needed
7. Submit

## 🔐 Security Notes

- **Credentials:** Stored in `.env`, never commit to git
- **File Type:** Validated on server (can't bypass)
- **File Size:** Enforced before upload
- **Authentication:** Required for all uploads

## 📊 How It Works

```
User selects image
    ↓
Frontend validates (size + type)
    ↓
If valid: Shows preview, allows submission
If invalid: Shows error message
    ↓
User submits form
    ↓
Backend validates again (security)
    ↓
Upload to Cloudinary (if configured)
    ↓
Fallback to local storage (if not configured)
    ↓
Return image URL to frontend
    ↓
Store URL in database
    ↓
Display on product/scrap listing
```

## 🎯 Testing Checklist

Quick test without Cloudinary:
```bash
# 1. Leave Cloudinary credentials blank in .env
# 2. Try uploading image via admin or Flutter
# 3. Should use local storage: /backend/uploads/
# 4. Files should still be validated (size + type)
```

With Cloudinary:
```bash
# 1. Add Cloudinary credentials to .env
# 2. Try uploading image
# 3. Check Cloudinary dashboard → Media Library
# 4. Image should appear in "ecotrade" folder
```

## 📚 Documentation Files

- **CLOUDINARY_SETUP.md** - Detailed setup guide (read if having issues)
- **CLOUDINARY_VERIFICATION.md** - Testing checklist (read to verify setup)
- **IMPLEMENTATION_SUMMARY.md** - Technical details (read for architecture)

## 🎓 File Locations Reference

```
ecotrade/
├── backend/
│   ├── utils/cloudinary.js (FILE VALIDATION)
│   ├── routes/products.js (ERROR HANDLING)
│   ├── routes/scrap.js (ERROR HANDLING)
│   ├── .env (CREDENTIALS)
│   └── .env.example (TEMPLATE)
├── admin/
│   └── src/pages/ProductForm.jsx (ADMIN UPLOAD UI)
├── ecotrade_flutter/
│   ├── lib/services/api_service.dart (API WITH MULTIPART)
│   ├── lib/screens/scrap/submit_scrap_screen.dart (IMAGE PICKER UI)
│   └── pubspec.yaml (DEPENDENCIES)
├── CLOUDINARY_SETUP.md
├── CLOUDINARY_VERIFICATION.md
└── IMPLEMENTATION_SUMMARY.md
```

## 💡 Pro Tips

1. **Test with small images first** (< 1MB) to ensure setup works
2. **Compress images before uploading** for faster transfers
3. **Use PNG for graphics, JPG for photos** (better compression)
4. **Monitor Cloudinary usage** to stay within free tier limits
5. **Clear browser cache** if images don't update

## 🔗 Useful Links

- Cloudinary Dashboard: https://cloudinary.com/console
- Image Compressor: https://tinypng.com
- MIME Types Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
- Flutter Image Picker Docs: https://pub.dev/packages/image_picker

## 📞 Quick Support

**Issue: Cloudinary credentials not working**
1. Double-check spelling in .env
2. Verify values from Cloudinary dashboard
3. Restart backend server
4. Check browser console for errors

**Issue: Flutter app crashes on image select**
1. Run `flutter pub get` again
2. Make sure iOS/Android permissions are granted
3. Check `pubspec.yaml` has `image_picker: ^1.0.0`

**Issue: Images show broken link**
1. Check Cloudinary credentials again
2. Verify image was actually uploaded (check Cloudinary dashboard)
3. Clear browser cache and reload

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
