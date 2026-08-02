import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../../services/current_location/current_location.dart';
import '../../utils/app_theme.dart';

class ScrapMapSelection {
  final double lat;
  final double lng;
  final String label;

  const ScrapMapSelection({
    required this.lat,
    required this.lng,
    required this.label,
  });
}

class _PlaceResult {
  final String name;
  final LatLng point;

  const _PlaceResult({required this.name, required this.point});

  factory _PlaceResult.fromJson(Map<String, dynamic> json) {
    return _PlaceResult(
      name: json['display_name']?.toString() ?? '',
      point: LatLng(
        double.tryParse(json['lat']?.toString() ?? '') ?? 0,
        double.tryParse(json['lon']?.toString() ?? '') ?? 0,
      ),
    );
  }
}

class ScrapMapScreen extends StatefulWidget {
  final bool pickerMode;
  final double? initialLat;
  final double? initialLng;
  final String? title;
  final String? searchHint;
  final String? pickerInstruction;
  final String? confirmLabel;

  const ScrapMapScreen({
    super.key,
    this.pickerMode = false,
    this.initialLat,
    this.initialLng,
    this.title,
    this.searchHint,
    this.pickerInstruction,
    this.confirmLabel,
  });

  @override
  State<ScrapMapScreen> createState() => _ScrapMapScreenState();
}

class _ScrapMapScreenState extends State<ScrapMapScreen> {
  static const _kathmandu = LatLng(27.7172, 85.3240);
  late final MapController _mapController;
  final _searchController = TextEditingController();
  late LatLng _selectedPoint;
  LatLng? _routeStart;
  List<LatLng> _routePoints = [];
  Timer? _searchDebounce;
  Timer? _routeRefreshTimer;
  bool _searching = false;
  bool _choosingRouteStart = false;
  bool _routeLoading = false;
  bool _routeRefreshInFlight = false;
  bool _autoRefreshingRoute = false;
  bool _locating = false;
  String? _routeError;
  List<_PlaceResult> _searchResults = [];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _selectedPoint = LatLng(
      widget.initialLat ?? _kathmandu.latitude,
      widget.initialLng ?? _kathmandu.longitude,
    );
  }

  String get _label =>
      'Pinned location (${_selectedPoint.latitude.toStringAsFixed(6)}, ${_selectedPoint.longitude.toStringAsFixed(6)})';

  void _setPoint(LatLng point) {
    setState(() => _selectedPoint = point);
  }

  void _setRouteStart(LatLng point) {
    _stopAutoRouteRefresh();
    setState(() {
      _routeStart = point;
      _routePoints = [];
      _routeError = null;
    });
  }

  Future<void> _searchPlaces(String query) async {
    _searchDebounce?.cancel();
    final trimmed = query.trim();
    if (trimmed.length < 3) {
      setState(() => _searchResults = []);
      return;
    }

    _searchDebounce = Timer(const Duration(milliseconds: 500), () async {
      setState(() => _searching = true);
      try {
        final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
          'q': trimmed,
          'format': 'jsonv2',
          'limit': '5',
          'countrycodes': 'np',
        });
        final res = await http.get(uri, headers: {'User-Agent': 'EcoTrade Flutter App'});
        if (res.statusCode != 200) return;
        final data = jsonDecode(res.body) as List;
        if (!mounted) return;
        setState(() {
          _searchResults = data
              .map((e) => _PlaceResult.fromJson(e as Map<String, dynamic>))
              .where((e) => e.name.isNotEmpty)
              .toList();
        });
      } finally {
        if (mounted) setState(() => _searching = false);
      }
    });
  }

  void _selectPlace(_PlaceResult place) {
    _searchController.text = place.name;
    _mapController.move(place.point, 16);
    setState(() {
      _selectedPoint = place.point;
      _searchResults = [];
    });
  }

  void _confirmSelection() {
    Navigator.of(context).pop(
      ScrapMapSelection(
        lat: _selectedPoint.latitude,
        lng: _selectedPoint.longitude,
        label: _label,
      ),
    );
  }

  void _startManualDirections({String? message}) {
    _stopAutoRouteRefresh();
    setState(() {
      _choosingRouteStart = true;
      _routeStart = null;
      _routePoints = [];
      _routeError = message;
    });
  }

  Future<void> _startInAppDirections() async {
    _stopAutoRouteRefresh();
    setState(() {
      _locating = true;
      _routeError = null;
    });

    final current = await getCurrentLocation();
    if (!mounted) return;

    if (current == null) {
      setState(() => _locating = false);
      _startManualDirections(message: 'Location permission unavailable. Tap your current location on the map.');
      return;
    }

    setState(() {
      _locating = false;
      _routeStart = current;
      _routePoints = [];
      _routeError = null;
    });
    await _findRouteInApp();
    _startAutoRouteRefresh();
  }

  void _startAutoRouteRefresh() {
    if (widget.pickerMode) return;
    _routeRefreshTimer?.cancel();
    if (mounted) {
      setState(() => _autoRefreshingRoute = true);
    } else {
      _autoRefreshingRoute = true;
    }
    _routeRefreshTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _refreshRouteFromCurrentLocation();
    });
  }

  void _stopAutoRouteRefresh() {
    _routeRefreshTimer?.cancel();
    _routeRefreshTimer = null;
    _autoRefreshingRoute = false;
  }

  Future<void> _refreshRouteFromCurrentLocation() async {
    if (!mounted || widget.pickerMode || _routeRefreshInFlight || _choosingRouteStart) return;
    _routeRefreshInFlight = true;
    try {
      final current = await getCurrentLocation();
      if (!mounted || current == null) return;
      setState(() {
        _routeStart = current;
        _routeError = null;
      });
      await _findRouteInApp(showLoading: false, fitCamera: false);
    } finally {
      _routeRefreshInFlight = false;
    }
  }

  Future<void> _findRouteInApp({bool showLoading = true, bool fitCamera = true}) async {
    final start = _routeStart;
    if (start == null) return;

    if (showLoading) {
      setState(() {
        _routeLoading = true;
        _routeError = null;
      });
    }

    try {
      final uri = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/'
        '${start.longitude},${start.latitude};'
        '${_selectedPoint.longitude},${_selectedPoint.latitude}'
        '?overview=full&geometries=geojson',
      );
      final res = await http.get(uri);
      if (res.statusCode != 200) {
        throw Exception('Route service unavailable');
      }

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final routes = data['routes'] as List? ?? [];
      if (routes.isEmpty) throw Exception('No route found');

      final geometry = routes.first['geometry'] as Map<String, dynamic>;
      final coords = geometry['coordinates'] as List;
      final points = coords.map((coord) {
        final pair = coord as List;
        return LatLng((pair[1] as num).toDouble(), (pair[0] as num).toDouble());
      }).toList();

      if (!mounted) return;
      setState(() {
        _routePoints = points;
        _choosingRouteStart = false;
      });

      if (fitCamera) {
        _mapController.fitCamera(
          CameraFit.bounds(
            bounds: LatLngBounds.fromPoints([start, _selectedPoint, ...points]),
            padding: const EdgeInsets.all(80),
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _routePoints = [start, _selectedPoint];
        _routeError = 'Exact road route unavailable, showing direct path.';
        _choosingRouteStart = false;
      });
    } finally {
      if (mounted && showLoading) setState(() => _routeLoading = false);
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _routeRefreshTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? (widget.pickerMode ? 'Pin Pickup Location' : 'Pickup Location')),
        actions: [
          if (!widget.pickerMode)
            IconButton(
              icon: const Icon(Icons.directions_outlined),
              tooltip: 'Use my location',
              onPressed: _locating || _routeLoading ? null : _startInAppDirections,
            ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedPoint,
              initialZoom: 14,
              maxZoom: 19,
              onTap: widget.pickerMode
                  ? (_, point) => _setPoint(point)
                  : _choosingRouteStart
                      ? (_, point) => _setRouteStart(point)
                      : null,
              onPositionChanged: widget.pickerMode
                  ? (position, hasGesture) {
                      final center = position.center;
                      if (hasGesture && center != null) _setPoint(center);
                    }
                  : null,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.ecotrade.app',
              ),
              if (_routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _routePoints,
                      color: AppColors.blue,
                      strokeWidth: 5,
                    ),
                  ],
                ),
              if (!widget.pickerMode)
                MarkerLayer(
                  markers: [
                    if (_routeStart != null)
                      Marker(
                        point: _routeStart!,
                        width: 44,
                        height: 44,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.blue,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                          ),
                          child: const Icon(Icons.my_location, color: Colors.white, size: 22),
                        ),
                      ),
                    Marker(
                      point: _selectedPoint,
                      width: 48,
                      height: 48,
                      child: const Icon(
                        Icons.location_pin,
                        color: AppColors.red,
                        size: 44,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          if (widget.pickerMode)
            const Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: 42),
                child: Icon(Icons.location_pin, color: AppColors.red, size: 48),
              ),
            ),
          if (widget.pickerMode)
            Positioned(
              left: 16,
              right: 16,
              top: 16,
              child: Column(children: [
                Material(
                  elevation: 8,
                  borderRadius: BorderRadius.circular(14),
                  color: Colors.white,
                  child: TextField(
                    controller: _searchController,
                    onChanged: _searchPlaces,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: widget.searchHint ?? 'Search pickup area or landmark',
                      prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                      suffixIcon: _searching
                          ? const Padding(
                              padding: EdgeInsets.all(14),
                              child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchResults = []);
                                  },
                                )
                              : null,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                ),
                if (_searchResults.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 12, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Column(
                      children: _searchResults.map((place) {
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.place_outlined, color: AppColors.green400),
                          title: Text(place.name, maxLines: 2, overflow: TextOverflow.ellipsis),
                          onTap: () => _selectPlace(place),
                        );
                      }).toList(),
                    ),
                  ),
              ]),
            ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.14),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  widget.pickerMode
                      ? (widget.pickerInstruction ?? 'Drag the map or search to place the pin')
                      : _choosingRouteStart
                          ? 'Tap your current/start location'
                          : 'Pinned pickup address',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  _choosingRouteStart
                      ? (_routeStart == null
                          ? (_routeError ?? 'Choose where the collector is starting from.')
                          : 'Start selected. Tap Find Route to draw directions in the app.')
                      : (_routeError ?? (_autoRefreshingRoute
                          ? 'Route auto-refreshes from your current location every 3 seconds.'
                          : _label)),
                  style: TextStyle(fontSize: 12, color: _routeError == null ? AppColors.textMuted : AppColors.yellow),
                ),
                const SizedBox(height: 12),
                if (!widget.pickerMode && _routePoints.isNotEmpty && !_choosingRouteStart)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: AppColors.green500.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.green500.withValues(alpha: 0.18)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.my_location, color: AppColors.green500, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _routeRefreshInFlight ? 'Updating route from your location...' : 'Live route tracking is on',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.green500),
                        ),
                      ),
                    ]),
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: widget.pickerMode
                          ? _confirmSelection
                          : _choosingRouteStart
                              ? (_routeStart == null || _routeLoading ? null : _findRouteInApp)
                              : (_locating || _routeLoading ? null : _startInAppDirections),
                      icon: _routeLoading || _locating
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Icon(widget.pickerMode ? Icons.check_rounded : Icons.directions_outlined),
                      label: Text(widget.pickerMode
                          ? (widget.confirmLabel ?? 'Use This Pickup Location')
                          : _choosingRouteStart
                              ? 'Find Route'
                              : (_locating ? 'Finding Your Location...' : 'Use My Location')),
                    ),
                  ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
