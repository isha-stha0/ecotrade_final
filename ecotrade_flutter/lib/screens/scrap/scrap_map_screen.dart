import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class ScrapMapScreen extends StatefulWidget {
  final String? scrapId;
  final double? initialLat;
  final double? initialLng;

  const ScrapMapScreen({
    Key? key,
    this.scrapId,
    this.initialLat,
    this.initialLng,
  }) : super(key: key);

  @override
  State<ScrapMapScreen> createState() => _ScrapMapScreenState();
}

class _ScrapMapScreenState extends State<ScrapMapScreen> {
  late MapController _mapController;
  List<Marker> _markers = [];
  List<LatLng> _routeCoordinates = [];
  Map<String, dynamic>? _selectedMarkerData;
  bool _showRoute = false;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _loadMapMarkers();
  }

  Future<void> _loadMapMarkers() async {
    try {
      setState(() => _isLoading = true);

      final response = await ApiService.get('/api/scrap/map/markers');

      if (response.statusCode == 200) {
        final data = response.data;
        final markersList = data['markers'] as List;

        setState(() {
          _markers = markersList.map((marker) {
            return Marker(
              point: LatLng(
                (marker['latitude'] as num).toDouble(),
                (marker['longitude'] as num).toDouble(),
              ),
              child: _buildMarkerIcon(marker['status']),
              width: 40.0,
              height: 40.0,
              builder: (ctx) => GestureDetector(
                onTap: () => _handleMarkerTap(marker),
                child: _buildMarkerIcon(marker['status']),
              ),
            );
          }).toList();

          _isLoading = false;
          _errorMessage = null;
        });

        // Center map on markers
        if (_markers.isNotEmpty) {
          final bounds = LatLngBounds.fromPoints(
            _markers.map((m) => m.point).toList(),
          );
          _mapController.fitBounds(bounds, options: const FitBoundsOptions(padding: EdgeInsets.all(100)));
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load map markers: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleMarkerTap(Map<String, dynamic> marker) async {
    setState(() => _selectedMarkerData = marker);

    // Load route if assigned
    if ((marker['status'] == 'assigned' || marker['status'] == 'collected') && widget.scrapId != null) {
      await _loadRouteInfo(widget.scrapId!);
    }
  }

  Future<void> _loadRouteInfo(String scrapId) async {
    try {
      final response = await ApiService.get('/api/scrap/$scrapId/route');

      if (response.statusCode == 200) {
        final data = response.data;
        final collectorLat = (data['collectorLocation']['lat'] as num).toDouble();
        final collectorLng = (data['collectorLocation']['lng'] as num).toDouble();
        final pickupLat = (data['pickupLocation']['lat'] as num).toDouble();
        final pickupLng = (data['pickupLocation']['lng'] as num).toDouble();

        setState(() {
          _routeCoordinates = [
            LatLng(collectorLat, collectorLng),
            LatLng(pickupLat, pickupLng),
          ];
          _showRoute = true;
        });

        // Fit bounds to show entire route
        if (_routeCoordinates.isNotEmpty) {
          final bounds = LatLngBounds.fromPoints(_routeCoordinates);
          _mapController.fitBounds(bounds, options: const FitBoundsOptions(padding: EdgeInsets.all(100)));
        }
      }
    } catch (e) {
      print('Error loading route: $e');
    }
  }

  Widget _buildMarkerIcon(String status) {
    final colors = {
      'pending': Colors.orange,
      'approved': Colors.green,
      'assigned': Colors.blue,
      'collected': Colors.purple,
      'completed': Colors.lightGreen,
      'rejected': Colors.red,
    };

    return Container(
      decoration: BoxDecoration(
        color: colors[status] ?? Colors.blue,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: (colors[status] ?? Colors.blue).withOpacity(0.5),
            blurRadius: 4,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: const Icon(Icons.location_pin, color: Colors.white, size: 20),
    );
  }

  Future<void> _openDirections(double lat, double lng) async {
    final googleMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng';
    if (await canLaunchUrl(Uri.parse(googleMapsUrl))) {
      await launchUrl(Uri.parse(googleMapsUrl));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scrap Collection Map'),
        elevation: 0,
        backgroundColor: const Color(0xFF667eea),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMapMarkers,
          ),
          IconButton(
            icon: const Icon(Icons.layers),
            onPressed: () => _showLegend(context),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Map
          _isLoading
              ? const Center(
                  child: CircularProgressIndicator(),
                )
              : _errorMessage != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: Colors.red),
                          const SizedBox(height: 16),
                          Text(_errorMessage!),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadMapMarkers,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    )
                  : FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        center: LatLng(27.7172, 85.324),
                        zoom: 13,
                        maxZoom: 19,
                      ),
                      children: [
                        // TileLayer
                        TileLayer(
                          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                          subdomains: const ['a', 'b', 'c'],
                          attributionBuilder: (_) {
                            return Text(
                              '© OpenStreetMap contributors',
                              style: Theme.of(context).textTheme.bodySmall,
                            );
                          },
                        ),
                        // Route Polyline
                        if (_showRoute && _routeCoordinates.isNotEmpty)
                          PolylineLayer(
                            polylines: [
                              Polyline(
                                points: _routeCoordinates,
                                color: Colors.blue,
                                strokeWidth: 4,
                                isDashed: true,
                              )
                            ],
                          ),
                        // Route Start/End Points
                        if (_showRoute && _routeCoordinates.isNotEmpty)
                          MarkerLayer(
                            markers: [
                              // Start point
                              Marker(
                                point: _routeCoordinates.first,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.green,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                  ),
                                  child: const Icon(Icons.check, color: Colors.white),
                                ),
                              ),
                              // End point
                              Marker(
                                point: _routeCoordinates.last,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                  ),
                                  child: const Icon(Icons.location_on, color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                        // Markers
                        MarkerLayer(markers: _markers),
                      ],
                    ),

          // Legend
          Positioned(
            top: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Status Legend',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  _legendItem('Pending', Colors.orange),
                  _legendItem('Approved', Colors.green),
                  _legendItem('Assigned', Colors.blue),
                  _legendItem('Collected', Colors.purple),
                  _legendItem('Completed', Colors.lightGreen),
                  _legendItem('Rejected', Colors.red),
                ],
              ),
            ),
          ),

          // Selected Marker Info Panel
          if (_selectedMarkerData != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    )
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _selectedMarkerData!['title'] ?? 'Scrap Request',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(_selectedMarkerData!['status']).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  _selectedMarkerData!['status'].toString().toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _getStatusColor(_selectedMarkerData!['status']),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => setState(() => _selectedMarkerData = null),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (_selectedMarkerData!['address'] != null)
                      _infoRow('Address', _selectedMarkerData!['address']),
                    if (_selectedMarkerData!['distance'] != null)
                      _infoRow('Distance', '${_selectedMarkerData!['distance'].toStringAsFixed(2)} km'),
                    if (_selectedMarkerData!['estimatedTime'] != null)
                      _infoRow('Est. Time', '${_selectedMarkerData!['estimatedTime']} mins'),
                    if (_selectedMarkerData!['amount'] != null)
                      _infoRow('Amount', 'Rs. ${_selectedMarkerData!['amount']}'),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _openDirections(
                          _selectedMarkerData!['latitude'],
                          _selectedMarkerData!['longitude'],
                        ),
                        icon: const Icon(Icons.directions),
                        label: const Text('Get Directions'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667eea),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _legendItem(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.grey.shade300),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    const colors = {
      'pending': Colors.orange,
      'approved': Colors.green,
      'assigned': Colors.blue,
      'collected': Colors.purple,
      'completed': Colors.lightGreen,
      'rejected': Colors.red,
    };
    return colors[status] ?? Colors.grey;
  }
}
