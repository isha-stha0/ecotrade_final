import 'dart:html' as html;

import 'package:latlong2/latlong.dart';

Future<LatLng?> getCurrentLocationImpl() async {
  try {
    final position = await html.window.navigator.geolocation.getCurrentPosition(
      enableHighAccuracy: true,
      timeout: const Duration(seconds: 12),
      maximumAge: const Duration(minutes: 1),
    );
    final coords = position.coords;
    if (coords == null) return null;
    final lat = coords.latitude;
    final lng = coords.longitude;
    if (lat == null || lng == null) return null;
    return LatLng(lat.toDouble(), lng.toDouble());
  } catch (_) {
    return null;
  }
}
