# Interactive Map - Quick Reference

## Quick Setup (5 minutes)

### React Admin Map

```bash
# Install dependencies
cd admin
npm install react-leaflet leaflet

# Copy files
# - MapComponent.jsx → src/components/
# - MapPage.jsx → src/pages/
# - MapComponent.css → src/styles/
# - MapPage.css → src/styles/

# Add route to your router
<Route path="/map" element={<MapPage />} />

# Done! Map is ready at /map
```

### Flutter Map

```bash
# Install dependencies
cd ecotrade_flutter
flutter pub add flutter_map latlong2 url_launcher

# Copy files
# - scrap_map_screen.dart → lib/screens/scrap/
# - location_tracking_service.dart → lib/services/

# Use in your app
Navigator.push(context, MaterialPageRoute(
  builder: (_) => ScrapMapScreen(scrapId: 'scrap_123'),
));
```

---

## File Locations

### React Files
```
admin/src/
├── components/MapComponent.jsx
├── pages/MapPage.jsx
└── styles/
    ├── MapComponent.css
    └── MapPage.css
```

### Flutter Files
```
ecotrade_flutter/lib/
├── screens/scrap/scrap_map_screen.dart
└── services/location_tracking_service.dart
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scrap/map/markers` | GET | Get all map markers |
| `/api/scrap/map/nearby` | GET | Find nearby scraps |
| `/api/scrap/{id}/location` | GET | Get scrap location |
| `/api/scrap/{id}/route` | GET | Get route information |
| `/api/scrap/collector/location` | POST | Update location |

---

## Component Props

### MapComponent
```javascript
<MapComponent
  markers={array}           // Scrap markers
  center={[lat, lng]}       // Map center
  zoom={13}                 // Zoom level
  selectedMarkerId={id}     // Highlight marker
  onMarkerClick={handler}   // Click callback
  showRoute={bool}          // Show route
  routeCoordinates={array}  // Route path
  selectedScrap={object}    // Selected details
/>
```

### ScrapMapScreen
```dart
ScrapMapScreen(
  scrapId: 'scrap_123',
  initialLat: 27.7172,
  initialLng: 85.324,
)
```

---

## Usage Examples

### React - Show Map
```javascript
import MapPage from './pages/MapPage';

<Route path="/map" element={<MapPage />} />
```

### Flutter - Tracking
```dart
final tracker = LocationTrackingService();
tracker.startTracking(scrapId: 'scrap_123', intervalSeconds: 10);
tracker.addListener((data) => print('Location: $data'));
tracker.stopTracking();
```

---

## Marker Colors

| Status | Color |
|--------|-------|
| Pending | 🟠 Orange |
| Approved | 🟢 Green |
| Assigned | 🔵 Blue |
| Collected | 🟣 Purple |
| Completed | 🟢 Light Green |
| Rejected | 🔴 Red |

---

## Testing Checklist

- [ ] React map loads at /map
- [ ] Markers display with correct colors
- [ ] Clicking marker shows details
- [ ] Filter by status works
- [ ] Auto-refresh enabled
- [ ] Route line displays
- [ ] Get Directions opens Google Maps
- [ ] Flutter map screen loads
- [ ] Flutter markers appear on map
- [ ] Location tracking works
- [ ] Collector location updates

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Map not loading | Check npm install & import statements |
| No markers | Verify API endpoint returns data |
| Styles broken | Check CSS file imports |
| Flutter map blank | Run `flutter pub get` |
| Tracking not working | Verify API endpoint & permissions |

---

## Performance Tips

1. **Limit markers** to 100 at a time
2. **Polling interval** 10-15 seconds optimal
3. **Use memoization** in React components
4. **Dispose streams** in Flutter widgets
5. **Test on real devices** for performance

---

## Next Steps

1. Install dependencies
2. Copy component files
3. Update API routes
4. Test map display
5. Enable auto-refresh
6. Test location tracking
7. Deploy to production

---

## Support

Refer to **INTERACTIVE_MAP_GUIDE.md** for:
- Detailed setup instructions
- Complete API documentation
- Troubleshooting guide
- Architecture overview
- Code examples

---

**Status:** ✅ Ready to Use  
**Version:** 1.0
