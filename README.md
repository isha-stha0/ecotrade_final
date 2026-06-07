# 🌱 EcoTrade — Complete Project

Smart Scrap-to-Product Platform | Flutter + Node.js + MongoDB

---

## 📁 Structure

```
ecotrade_final/
├── backend/              ← Node.js + Express + MongoDB API
│   ├── models/           ← User, Scrap, Product, Order
│   ├── routes/           ← auth, scrap, products, orders, admin, dashboard
│   ├── middleware/       ← JWT auth
│   ├── server.js
│   ├── seed.js           ← Creates demo users + products
│   └── .env
│
└── ecotrade_flutter/     ← Flutter Android/iOS App
    ├── lib/
    │   ├── main.dart
    │   ├── models/
    │   ├── services/     ← API client, Auth & Cart providers
    │   ├── utils/        ← Theme, colors, constants
    │   ├── widgets/      ← Reusable UI components
    │   └── screens/
    │       ├── splash/
    │       ├── auth/     ← Login, Register
    │       ├── home/     ← Dashboard
    │       ├── shop/     ← Shop, Product Detail, Cart, Checkout
    │       ├── scrap/    ← Submit Scrap
    │       ├── orders/   ← My Orders
    │       ├── profile/  ← Profile, Settings
    │       └── admin/    ← Admin Panel (4 tabs)
    └── android/          ← Android config (icons, gradle)
```

---

## 🚀 Setup in 5 Steps

### Step 1 — Start MongoDB
Make sure MongoDB is running on your computer.
- Windows: MongoDB Compass or run `mongod` in terminal
- Or use MongoDB Atlas (cloud) — update MONGODB_URI in .env

### Step 2 — Start Backend
```cmd
cd ecotrade_final\backend
npm install
node seed.js
npm run dev
```
You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### Step 3 — Configure Flutter IP
Open: `ecotrade_flutter\lib\utils\app_theme.dart`

Change the IP based on your setup:
```dart
// Android Emulator (default - no change needed)
static const String baseUrl = 'http://10.0.2.2:5000/api';

// Physical Android phone on same WiFi:
static const String baseUrl = 'http://192.168.1.XXX:5000/api';
// Replace XXX with your PC's IP (run ipconfig to find it)
```

### Step 4 — Run Flutter App
```cmd
cd ecotrade_final\ecotrade_flutter
flutter clean
flutter pub get
flutter run
```

### Step 5 — Pick Your Device
When prompted, select your Android device or emulator.

---

## 🔑 Demo Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecotrade.com | admin123 |
| User  | user@ecotrade.com  | user1234 |

---

## 📱 App Screens

| Screen | Description |
|--------|-------------|
| Splash | Animated logo → auto navigates |
| Login / Register | JWT auth with role selection |
| Home Dashboard | Stats, EcoPoints, recent activity |
| Shop | Product grid, search, filters |
| Product Detail | Full info, qty picker, add to cart |
| Cart | Qty controls, total, checkout |
| Checkout | Address, payment (COD/eSewa/Khalti) |
| Submit Scrap | Category grid, live EcoPoints preview |
| My Orders | Order history with status |
| Profile | Edit profile, change password, logout |
| Admin Panel | Dashboard, Scraps, Products, Orders |

---

## 🔧 If flutter run fails

**Gradle error** — check you have these in `android/gradle/wrapper/gradle-wrapper.properties`:
```
distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
```

**NDK error** — already fixed: `ndkVersion "27.0.12077973"` in `app/build.gradle`

**Connection refused from phone** — update baseUrl in app_theme.dart to your PC's WiFi IP

---

## 🌍 Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | Flutter 3.x + Dart |
| State | Provider |
| HTTP | http package |
| Backend | Node.js + Express |
| Auth | JWT + bcryptjs |
| Database | MongoDB + Mongoose |
| Charts | fl_chart |
| UI Font | Plus Jakarta Sans |

---

Built with 💚 by Isha Shrestha — NP069784
