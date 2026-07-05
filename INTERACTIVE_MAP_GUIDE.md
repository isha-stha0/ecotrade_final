# Interactive Map Implementation Guide

## Overview

This guide covers the complete implementation of interactive maps for the EcoTrade platform using:
- **React Admin Panel**: Leaflet.js for web-based map visualization
- **Flutter Mobile App**: flutter_map with OpenStreetMap for mobile tracking

---

## Part 1: React Admin Map Setup

### Installation

```bash
cd admin
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

### File Structure

```
admin/src/
├── components/
│   └── MapComponent.jsx          (Reusable map widget)
├── pages/
│   └── MapPage.jsx               (Admin map dashboard)
├── styles/
│   ├── MapComponent.css          (Map widget styles)
│   └── MapPage.css               (Dashboard styles)
└── api/
    └── api.js                    (API methods - updated)
```

### Component: MapComponent.jsx

**Features:**
- Display scrap locations with color-coded markers
- Marker colors indicate status (pending, approved, assigned, etc.)
- Click markers to view details
- Show route lines between collector and pickup location
- Interactive popups with scrap information
- Tooltips on hover
- Responsive legend

**Props:**
```javascript
<MapComponent
  markers={[...]}              // Array of marker objects
  center={[lat, lng]}          // Map center [latitude, longitude]
  zoom={13}                    // Initial zoom level
  selectedMarkerId={id}        // Highlight a marker
  onMarkerClick={handler}      // Callback on marker click
  showRoute={true}             // Show route line
  routeCoordinates={[...]}     // Route coordinates [[lat, lng], ...]
  selectedScrap={scrapData}    // Selected scrap details
/>
```

**Marker Object Structure:**
```javascript
{
  id: "scrap_123",
  title: "Old Electronics",
  latitude: 27.7172,
  longitude: 85.324,
  status: "assigned",           // pending, approved, assigned, collected, completed, rejected
  address: "123 Main St, Kathmandu",
  collectorName: "John Doe",
  distance: 2.5,                // km
  estimatedTime: 15,            // minutes
  amount: 500,                  // Rs.
  type: "scrap_request"
}
```

### Page: MapPage.jsx

**Features:**
- Display all scrap requests on map
- Filter by status (pending, approved, assigned, etc.)
- Auto-refresh capability (every 10 seconds)
- Real-time marker updates
- Selected marker detail panel
- View statistics (total requests, pending, completed, in-progress)
- Get directions link

**Usage:**
```javascript
// Add to admin routes
import MapPage from './pages/MapPage';

// In your router
<Route path="/map" element={<MapPage />} />
```

### Marker Color Codes

| Status | Color | Hex Code |
|--------|-------|----------|
| Pending | Orange | #ff9800 |
| Approved | Green | #4caf50 |
| Assigned | Blue | #2196f3 |
| Collected | Purple | #9c27b0 |
| Completed | Light Green | #8bc34a |
| Rejected | Red | #f44336 |

### CSS Styling

**Key Classes:**
- `.map-container` - Main map wrapper
- `.custom-marker` - Marker styling
- `.marker-popup` - Popup content
- `.map-legend` - Status legend
- `.info-panel` - Details panel

### API Integration

**Updated API Methods (admin/src/api/api.js):**

```javascript
// Get all map markers
orderAPI.getScrapMapMarkers(status = null)

// Get nearby scrap requests
orderAPI.getNearbyScrapRequests(lat, lng, radius = 5)

// Get scrap location data
orderAPI.getScrapLocationData(scrapId)

// Get route info (distance, time, coordinates)
orderAPI.getScrapRouteInfo(scrapId)

// Update collector location
orderAPI.updateCollectorLocation(lat, lng)
```

---

## Part 2: Flutter Map Setup

### Installation

```bash
cd ecotrade_flutter
flutter pub add flutter_map latlong2 url_launcher
flutter pub get
```

### Dependencies Added to pubspec.yaml

```yaml
dependencies:
  flutter_map: ^6.0.0
  latlong2: ^0.9.0
  url_launcher: ^6.1.0
```

### File Structure

```
lib/
├── screens/
│   └── scrap/
│       └── scrap_map_screen.dart    (Map screen)
├── services/
│   ├── api_service.dart             (Updated for map APIs)
│   └── location_tracking_service.dart (Real-time tracking)
```

### Screen: ScrapMapScreen

**Features:**
- Display scrap locations on map
- Color-coded status markers
- Route visualization (collector → pickup)
- Selected marker detail panel
- Get directions (Google Maps integration)
- Marker legend
- Error handling

**Usage:**
```dart
// Navigate to map screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ScrapMapScreen(
      scrapId: 'scrap_123',
      initialLat: 27.7172,
      initialLng: 85.324,
    ),
  ),
);
```

### Service: LocationTrackingService

**Features:**
- Polling-based location updates (configurable interval)
- Stream-based real-time updates
- Start/stop tracking
- Listener pattern for UI updates
- Error handling

**Usage:**
```dart
// Start tracking
final tracker = LocationTrackingService();
tracker.startTracking(
  scrapId: 'scrap_123',
  intervalSeconds: 10,
);

// Listen to updates
tracker.addListener((locationData) {
  print('New location: ${locationData['collectorLocation']}');
});

// Stop tracking
tracker.stopTracking();

// Or use stream
tracker.locationStream.listen((locationData) {
  print('Location update: $locationData');
});
```

---

## Part 3: Backend API Endpoints

### Map Endpoints

**1. Get Map Markers**
```
GET /api/scrap/map/markers?status=assigned
Authorization: Bearer {token}

Response:
{
  "markers": [
    {
      "id": "scrap_123",
      "latitude": 27.7172,
      "longitude": 85.324,
      "status": "assigned",
      "title": "Scrap Request",
      "address": "123 Main St",
      "distance": 2.5,
      "estimatedTime": 15,
      "collectorName": "John Doe"
    }
  ],
  "center": [27.7172, 85.324]
}
```

**2. Get Nearby Scrap Requests**
```
GET /api/scrap/map/nearby?lat=27.7172&lng=85.324&radius=5
Authorization: Bearer {token}

Response:
{
  "scraps": [
    {
      "id": "scrap_123",
      "latitude": 27.7172,
      "longitude": 85.324,
      "distance": 2.5,
      "estimatedTime": 15,
      "status": "pending",
      "amount": 500
    }
  ]
}
```

**3. Get Scrap Location Data**
```
GET /api/scrap/{scrapId}/location
Authorization: Bearer {token}

Response:
{
  "scrapId": "scrap_123",
  "pickupLocation": {
    "lat": 27.7172,
    "lng": 85.324
  },
  "collectorLocation": {
    "lat": 27.7150,
    "lng": 85.3200,
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "collectorName": "John Doe",
  "status": "assigned",
  "distance": 2.5,
  "estimatedTime": 15
}
```

**4. Get Route Information**
```
GET /api/scrap/{scrapId}/route
Authorization: Bearer {token}

Response:
{
  "collectorLocation": {
    "lat": 27.7150,
    "lng": 85.3200
  },
  "pickupLocation": {
    "lat": 27.7172,
    "lng": 85.324
  },
  "distance": 2.5,
  "estimatedTime": 15,
  "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&origin=27.7150,85.3200&destination=27.7172,85.324"
}
```

**5. Update Collector Location**
```
POST /api/scrap/collector/location
Authorization: Bearer {token}

Body:
{
  "latitude": 27.7160,
  "longitude": 85.3220
}

Response:
{
  "success": true,
  "message": "Location updated",
  "location": {
    "latitude": 27.7160,
    "longitude": 85.3220,
    "timestamp": "2024-01-15T10:30:15Z"
  }
}
```

---

## Part 4: Usage Examples

### Admin React - Display Map with Filters

```javascript
import MapPage from './pages/MapPage';

function AdminDashboard() {
  return (
    <div>
      <MapPage />
    </div>
  );
}
```

### React - Handle Marker Click

```javascript
const handleMarkerClick = (marker) => {
  console.log('Selected scrap:', marker);
  // Load route info, show details, etc.
};

<MapComponent
  markers={markers}
  onMarkerClick={handleMarkerClick}
/>
```

### Flutter - Start Tracking

```dart
import 'package:ecotrade/services/location_tracking_service.dart';

class CollectorTrackingWidget extends StatefulWidget {
  @override
  _CollectorTrackingWidgetState createState() => _CollectorTrackingWidgetState();
}

class _CollectorTrackingWidgetState extends State<CollectorTrackingWidget> {
  late LocationTrackingService _tracker;

  @override
  void initState() {
    super.initState();
    _tracker = LocationTrackingService();
    
    // Start tracking
    _tracker.startTracking(
      scrapId: widget.scrapId,
      intervalSeconds: 10,
    );
    
    // Listen to updates
    _tracker.addListener(_handleLocationUpdate);
  }

  void _handleLocationUpdate(Map<String, dynamic> locationData) {
    setState(() {
      // Update UI with new location
      collectorLat = locationData['collectorLocation']['lat'];
      collectorLng = locationData['collectorLocation']['lng'];
    });
  }

  @override
  void dispose() {
    _tracker.stopTracking();
    _tracker.removeListener(_handleLocationUpdate);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScrapMapScreen(scrapId: widget.scrapId);
  }
}
```

---

## Part 5: Testing

### Admin Map Testing

1. **Load Map Page**
   - Navigate to `/map`
   - Verify map loads with OpenStreetMap tiles

2. **Display Markers**
   - Check markers appear for all scrap requests
   - Verify color coding by status
   - Hover over markers to see tooltips

3. **Filter by Status**
   - Select different status filters
   - Verify only matching markers appear

4. **Click Markers**
   - Click a marker
   - Verify detail panel shows correct information
   - Check "Get Directions" button opens Google Maps

5. **Route Display**
   - Click an "assigned" scrap marker
   - Verify route line appears
   - Check start/end points are marked

6. **Auto-Refresh**
   - Enable auto-refresh
   - Verify map updates every 10 seconds
   - Check "Last updated" timestamp

### Flutter Map Testing

1. **Open Map Screen**
   - Navigate to map screen
   - Verify OpenStreetMap loads
   - Check all markers display

2. **View Marker Details**
   - Tap a marker
   - Verify bottom panel shows details
   - Check distance and time calculations

3. **Get Directions**
   - Tap "Get Directions" button
   - Verify Google Maps opens with route

4. **Location Tracking**
   - Start tracking a scrap
   - Verify location updates every 10 seconds
   - Check collector location moves on map

---

## Part 6: Troubleshooting

### React Map Issues

**Map not loading:**
- Check if react-leaflet and leaflet are installed
- Verify OpenStreetMap tiles are accessible
- Check console for errors

**Markers not appearing:**
- Verify API endpoint returns correct data
- Check marker latitude/longitude values
- Ensure coordinates are numbers, not strings

**Styles not working:**
- Verify CSS file is imported in MapPage.jsx
- Check CSS file path is correct
- Clear browser cache

### Flutter Map Issues

**Map widget not loading:**
- Run `flutter pub get` to install dependencies
- Check if flutter_map version is compatible
- Verify OpenStreetMap URL is accessible

**Markers not showing:**
- Check API response structure
- Verify lat/lng are doubles, not integers
- Check network requests in Dart DevTools

**Location tracking not working:**
- Verify API endpoint is responding
- Check location permissions on device
- Monitor polling requests in network tab

---

## Part 7: Performance Optimization

### React Admin

1. **Marker Limit**: Load max 100 markers at once
   - Implement pagination if needed
   - Use clustering for large datasets

2. **Auto-Refresh**: Set appropriate interval
   - Default: 10 seconds
   - Adjustable based on needs

3. **Memoization**:
   ```javascript
   const MapComponent = React.memo(function MapComponent(props) {
     // Component code
   });
   ```

### Flutter

1. **Polling Interval**: Balance accuracy vs performance
   - Default: 10 seconds
   - Adjust based on requirements

2. **Stream Management**:
   - Dispose streams properly in StatefulWidget
   - Avoid memory leaks

3. **UI Updates**: Only rebuild necessary widgets
   - Use StreamBuilder for targeted updates
   - Avoid full screen rebuilds

---

## Part 8: Security Considerations

1. **Authentication**: All endpoints require Bearer token
2. **Authorization**: Users see only their own scraps
3. **Coordinates**: Validated before storage
4. **Rate Limiting**: Implement for location polling
5. **HTTPS**: Use HTTPS for all map API calls

---

## Part 9: Future Enhancements

1. **WebSocket**: Replace polling with WebSocket for real-time updates
2. **Clustering**: Group nearby markers to reduce clutter
3. **Heatmap**: Show scrap concentration areas
4. **Offline Maps**: Cache tiles for offline use
5. **Notifications**: Alert on collector arrival
6. **Geofencing**: Automatic status updates based on location

---

## Summary

✅ **Interactive Map Features Implemented:**
- React Admin dashboard with Leaflet maps
- Flutter mobile maps with OpenStreetMap
- Real-time location tracking service
- Comprehensive styling and animations
- Error handling and user feedback
- Role-based access control
- Performance optimized

✅ **Ready for Deployment:**
- All components tested and working
- Comprehensive documentation provided
- Integration guide for both platforms
- Troubleshooting guide included

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Complete
