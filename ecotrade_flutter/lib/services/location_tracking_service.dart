import 'dart:async';
import '../services/api_service.dart';

class LocationTrackingService {
  static final LocationTrackingService _instance = LocationTrackingService._internal();
  
  factory LocationTrackingService() {
    return _instance;
  }
  
  LocationTrackingService._internal();

  Timer? _pollingTimer;
  final List<Function(Map<String, dynamic>)> _listeners = [];
  bool _isTracking = false;

  // Stream for real-time location updates
  final StreamController<Map<String, dynamic>> _locationStreamController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get locationStream => _locationStreamController.stream;

  /// Start tracking collector location with polling
  /// Polls every [intervalSeconds] seconds (default: 10)
  Future<void> startTracking({
    required String scrapId,
    int intervalSeconds = 10,
  }) async {
    if (_isTracking) {
      print('Already tracking location');
      return;
    }

    _isTracking = true;
    print('Starting location tracking for scrap: $scrapId');

    _pollingTimer = Timer.periodic(Duration(seconds: intervalSeconds), (_) async {
      try {
        await _fetchCollectorLocation(scrapId);
      } catch (e) {
        print('Error fetching location: $e');
      }
    });

    // Fetch location immediately on start
    try {
      await _fetchCollectorLocation(scrapId);
    } catch (e) {
      print('Error fetching initial location: $e');
    }
  }

  /// Stop tracking location
  void stopTracking() {
    if (_pollingTimer != null) {
      _pollingTimer!.cancel();
      _isTracking = false;
      print('Location tracking stopped');
    }
  }

  /// Fetch collector location from backend
  Future<void> _fetchCollectorLocation(String scrapId) async {
    try {
      final data =
          await ApiService().get('/scrap/$scrapId/location') as Map<String, dynamic>;
        
        // Emit location update
        if (data['collectorLocation'] != null) {
          final locationData = {
            'scrapId': scrapId,
            'collectorLocation': {
              'lat': (data['collectorLocation']['lat'] as num).toDouble(),
              'lng': (data['collectorLocation']['lng'] as num).toDouble(),
              'updatedAt': data['collectorLocation']['updatedAt'],
            },
            'pickupLocation': {
              'lat': (data['pickupLocation']['lat'] as num).toDouble(),
              'lng': (data['pickupLocation']['lng'] as num).toDouble(),
            },
            'collectorName': data['collectorName'],
            'status': data['status'],
            'distance': data['distance'],
            'estimatedTime': data['estimatedTime'],
          };

          // Notify all listeners
          _notifyListeners(locationData);

          // Emit to stream
          _locationStreamController.add(locationData);
        }
    } catch (e) {
      print('Error fetching collector location: $e');
      rethrow;
    }
  }

  /// Add a listener for location updates
  void addListener(Function(Map<String, dynamic>) listener) {
    _listeners.add(listener);
  }

  /// Remove a listener
  void removeListener(Function(Map<String, dynamic>) listener) {
    _listeners.remove(listener);
  }

  /// Notify all listeners of location update
  void _notifyListeners(Map<String, dynamic> locationData) {
    for (var listener in _listeners) {
      listener(locationData);
    }
  }

  /// Get current tracking status
  bool get isTracking => _isTracking;

  /// Dispose resources
  void dispose() {
    stopTracking();
    _listeners.clear();
    _locationStreamController.close();
  }
}

/// Custom location update model
class LocationUpdate {
  final String scrapId;
  final double collectorLat;
  final double collectorLng;
  final double pickupLat;
  final double pickupLng;
  final String collectorName;
  final String status;
  final double? distance;
  final int? estimatedTime;
  final DateTime updatedAt;

  LocationUpdate({
    required this.scrapId,
    required this.collectorLat,
    required this.collectorLng,
    required this.pickupLat,
    required this.pickupLng,
    required this.collectorName,
    required this.status,
    this.distance,
    this.estimatedTime,
    required this.updatedAt,
  });

  factory LocationUpdate.fromJson(Map<String, dynamic> json) {
    return LocationUpdate(
      scrapId: json['scrapId'] as String,
      collectorLat: (json['collectorLocation']['lat'] as num).toDouble(),
      collectorLng: (json['collectorLocation']['lng'] as num).toDouble(),
      pickupLat: (json['pickupLocation']['lat'] as num).toDouble(),
      pickupLng: (json['pickupLocation']['lng'] as num).toDouble(),
      collectorName: json['collectorName'] as String,
      status: json['status'] as String,
      distance: json['distance'] as double?,
      estimatedTime: json['estimatedTime'] as int?,
      updatedAt: DateTime.parse(json['collectorLocation']['updatedAt'] as String),
    );
  }
}
