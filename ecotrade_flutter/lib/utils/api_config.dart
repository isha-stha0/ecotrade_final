import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  static const int port = 5000;

  /// Your PC's WiFi/LAN IP (run `ipconfig` on Windows).
  /// Used when [usePhysicalDeviceHost] is true (physical phone on same WiFi).
  static const String physicalDeviceHost = '192.168.10.70';

  /// Set to `true` when running on a **physical** Android/iOS device.
  /// Set to `false` for Android emulator, iOS simulator, or desktop.
  static const bool usePhysicalDeviceHost = false;

  static String get baseUrl {
    if (usePhysicalDeviceHost) {
      return 'http://$physicalDeviceHost:$port/api';
    }
    if (kIsWeb) return 'http://localhost:$port/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:$port/api';
    return 'http://localhost:$port/api';
  }
}
