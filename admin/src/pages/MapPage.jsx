import { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import { orderAPI } from '../api/api';
import '../styles/MapPage.css';

const MapPage = () => {
  const [markers, setMarkers] = useState([]);
  const [selectedScrap, setSelectedScrap] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [showRoute, setShowRoute] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.324]);
  const [mapZoom, setMapZoom] = useState(13);
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch map markers
  const fetchMapMarkers = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getScrapMapMarkers(filterStatus !== 'all' ? filterStatus : null);
      
      if (response) {
        setMarkers(response.markers || []);
        
        // Set map center to first marker if available
        if (response.markers && response.markers.length > 0) {
          const bounds = response.markers;
          const avgLat = bounds.reduce((sum, m) => sum + (m.lat ?? m.latitude), 0) / bounds.length;
          const avgLng = bounds.reduce((sum, m) => sum + (m.lng ?? m.longitude), 0) / bounds.length;
          setMapCenter([avgLat, avgLng]);
        }
      }
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load map markers: ' + (err.message || 'Unknown error'));
      console.error('Error fetching markers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch route information
  const fetchRouteInfo = async (scrapId) => {
    try {
      const response = await orderAPI.getScrapRouteInfo(scrapId);
      
      if (response && response.route) {
        // Convert coordinates for route line
        const coords = [
          [response.collector_location.lat, response.collector_location.lng],
          [response.scrap_location.lat, response.scrap_location.lng]
        ];
        setRouteCoordinates(coords);
        setShowRoute(true);
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      setError('Failed to load route information');
    }
  };

  // Handle marker click
  const handleMarkerClick = (marker) => {
    setSelectedScrap(marker);
    setShowRoute(false);
    
    // Fetch route if assigned
    if (marker.status === 'assigned' || marker.status === 'collected') {
      fetchRouteInfo(marker.id);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMapMarkers();
  }, [filterStatus]);

  // Auto refresh setup
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchMapMarkers();
      }, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, filterStatus]);

  return (
    <div className="map-page">
      <div className="map-page-header">
        <h1>Scrap Collection Map</h1>
        <p>Monitor all scrap requests and collection activities in real-time</p>
      </div>

      {/* Controls */}
      <div className="map-page-controls">
        <div className="control-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select 
            id="status-filter"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="assigned">Assigned</option>
            <option value="collected">Collected</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="checkbox"
            />
            Auto Refresh (every 10s)
          </label>
        </div>

        <div className="control-group">
          <button 
            onClick={fetchMapMarkers}
            disabled={loading}
            className="btn-refresh"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <span className="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn-close">×</button>
        </div>
      )}

      {/* Map Container */}
      <div className="map-wrapper">
        {loading && markers.length === 0 ? (
          <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>Loading map...</p>
          </div>
        ) : markers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-map"></i>
            <p>No scrap requests found</p>
            <button onClick={fetchMapMarkers} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : (
          <MapComponent
            markers={markers}
            center={mapCenter}
            zoom={mapZoom}
            selectedMarkerId={selectedScrap?.id}
            onMarkerClick={handleMarkerClick}
            showRoute={showRoute}
            routeCoordinates={routeCoordinates}
            selectedScrap={selectedScrap}
          />
        )}
      </div>

      {/* Info Panel */}
      {selectedScrap && (
        <div className="info-panel">
          <div className="info-header">
            <h3>Request Details</h3>
            <button 
              onClick={() => {
                setSelectedScrap(null);
                setShowRoute(false);
              }}
              className="btn-close"
            >
              ×
            </button>
          </div>

          <div className="info-content">
            <div className="info-section">
              <h4>Location Information</h4>
              <div className="info-row">
                <span>Address:</span>
                <strong>{selectedScrap.address || 'Not specified'}</strong>
              </div>
              <div className="info-row">
                <span>Latitude:</span>
                <strong>{(selectedScrap.lat ?? selectedScrap.latitude)?.toFixed(6)}</strong>
              </div>
              <div className="info-row">
                <span>Longitude:</span>
                <strong>{(selectedScrap.lng ?? selectedScrap.longitude)?.toFixed(6)}</strong>
              </div>
            </div>

            <div className="info-section">
              <h4>Request Status</h4>
              <div className="info-row">
                <span>Status:</span>
                <span className={`status-badge status-${selectedScrap.status}`}>
                  {selectedScrap.status?.toUpperCase()}
                </span>
              </div>
              {selectedScrap.collectorName && (
                <div className="info-row">
                  <span>Assigned Collector:</span>
                  <strong>{selectedScrap.collectorName}</strong>
                </div>
              )}
              {selectedScrap.distance && (
                <div className="info-row">
                  <span>Distance:</span>
                  <strong>{selectedScrap.distance.toFixed(2)} km</strong>
                </div>
              )}
              {selectedScrap.estimatedTime && (
                <div className="info-row">
                  <span>Est. Collection Time:</span>
                  <strong>{selectedScrap.estimatedTime} minutes</strong>
                </div>
              )}
            </div>

            {selectedScrap.amount && (
              <div className="info-section">
                <h4>Amount</h4>
                <div className="info-row">
                  <span>Reward Amount:</span>
                  <strong className="amount">Rs. {selectedScrap.amount}</strong>
                </div>
              </div>
            )}

            {selectedScrap.id && (
              <div className="info-actions">
                <button 
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedScrap.lat ?? selectedScrap.latitude},${selectedScrap.lng ?? selectedScrap.longitude}`,
                      '_blank'
                    );
                  }}
                  className="btn-action btn-directions"
                >
                  <i className="fas fa-directions"></i>
                  Get Directions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="map-stats">
        <div className="stat-box">
          <i className="fas fa-map-pin"></i>
          <div>
            <strong>{markers.length}</strong>
            <span>Total Requests</span>
          </div>
        </div>
        <div className="stat-box">
          <i className="fas fa-hourglass-start"></i>
          <div>
            <strong>{markers.filter(m => m.status === 'pending').length}</strong>
            <span>Pending</span>
          </div>
        </div>
        <div className="stat-box">
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>{markers.filter(m => m.status === 'completed').length}</strong>
            <span>Completed</span>
          </div>
        </div>
        <div className="stat-box">
          <i className="fas fa-clock"></i>
          <div>
            <strong>{markers.filter(m => m.status === 'assigned' || m.status === 'collected').length}</strong>
            <span>In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
