import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import '../styles/MapComponent.css';

// Custom icons for different marker types
const createCustomIcon = (color, type) => {
  return L.divIcon({
    html: `
      <div class="marker-icon marker-${color}" title="${type}">
        <i class="fas fa-map-pin"></i>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const MARKER_COLORS = {
  pending: 'orange',
  approved: 'green',
  assigned: 'blue',
  collected: 'purple',
  completed: 'lightgreen',
  rejected: 'red'
};

const MapComponent = ({
  markers = [],
  center = [27.7172, 85.324],
  zoom = 13,
  selectedMarkerId = null,
  onMarkerClick = null,
  showRoute = false,
  routeCoordinates = [],
  selectedScrap = null
}) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(selectedMarkerId);

  // Update selected marker when prop changes
  useEffect(() => {
    setSelectedMarker(selectedMarkerId);
  }, [selectedMarkerId]);

  // Handle marker click
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker.id);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  // Fit bounds when route is shown
  useEffect(() => {
    if (mapInstance && showRoute && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [mapInstance, showRoute, routeCoordinates]);

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '600px', width: '100%' }}
        whenCreated={setMapInstance}
      >
        {/* Map Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat ?? marker.latitude, marker.lng ?? marker.longitude]}
            icon={createCustomIcon(MARKER_COLORS[marker.status] || 'blue', marker.type)}
            eventHandlers={{
              click: () => handleMarkerClick(marker)
            }}
          >
            <Popup>
              <div className="marker-popup">
                <h4>{marker.title || 'Scrap Request'}</h4>
                <p><strong>Status:</strong> <span className={`status-${marker.status}`}>{marker.status}</span></p>
                <p><strong>Location:</strong> {marker.address || 'Not specified'}</p>
                {marker.distance && (
                  <p><strong>Distance:</strong> {marker.distance.toFixed(2)} km</p>
                )}
                {marker.estimatedTime && (
                  <p><strong>Est. Time:</strong> {marker.estimatedTime} mins</p>
                )}
                {marker.collectorName && (
                  <p><strong>Collector:</strong> {marker.collectorName}</p>
                )}
                {marker.amount && (
                  <p><strong>Amount:</strong> Rs. {marker.amount}</p>
                )}
              </div>
            </Popup>

            {/* Tooltip for hover */}
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              {marker.title || 'Scrap Request'} - {marker.status}
            </Tooltip>
          </Marker>
        ))}

        {/* Route Line */}
        {showRoute && routeCoordinates.length > 0 && (
          <>
            {/* Route Path */}
            <GeoJSON data={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates.map(coord => [coord[1], coord[0]])
              }
            }}
            style={{
              color: '#3388ff',
              weight: 4,
              opacity: 0.8,
              dashArray: '5, 5'
            }}
            />

            {/* Route Start Point */}
            {routeCoordinates.length > 0 && (
              <Circle
                center={routeCoordinates[0]}
                radius={100}
                color="green"
                fill={true}
                fillColor="green"
                fillOpacity={0.5}
              >
                <Popup>Route Start</Popup>
              </Circle>
            )}

            {/* Route End Point */}
            {routeCoordinates.length > 0 && (
              <Circle
                center={routeCoordinates[routeCoordinates.length - 1]}
                radius={100}
                color="red"
                fill={true}
                fillColor="red"
                fillOpacity={0.5}
              >
                <Popup>Route End</Popup>
              </Circle>
            )}
          </>
        )}

        {/* Collector Location (if tracking) */}
        {selectedScrap && selectedScrap.collectorLocation && (
          <Marker
            position={[selectedScrap.collectorLocation.lat, selectedScrap.collectorLocation.lng]}
            icon={L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="collector-popup">
                <h4>Collector Current Location</h4>
                <p><strong>Name:</strong> {selectedScrap.collectorName}</p>
                <p><strong>Latitude:</strong> {selectedScrap.collectorLocation.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {selectedScrap.collectorLocation.lng.toFixed(6)}</p>
                <p><strong>Last Updated:</strong> {selectedScrap.collectorLocation.updatedAt ? new Date(selectedScrap.collectorLocation.updatedAt).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <h4>Status Legend</h4>
        {Object.entries(MARKER_COLORS).map(([status, color]) => (
          <div key={status} className="legend-item">
            <div className={`legend-color marker-${color}`}></div>
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapComponent;
