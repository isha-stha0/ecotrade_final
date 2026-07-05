// Location & Map Service for Scrap Collection Tracking
// Handles location-based operations and route visualization

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Estimate travel time (simple linear estimate)
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Average speed in km/h (default 30)
 * @returns {number} Travel time in minutes
 */
const estimateTravelTime = (distanceKm, speedKmh = 30) => {
  return Math.ceil((distanceKm / speedKmh) * 60);
};

/**
 * Format location for display
 * @param {object} location - Location object with lat, lng
 * @returns {object} Formatted location data
 */
const formatLocation = (location) => {
  if (!location || !location.lat || !location.lng) {
    return null;
  }
  return {
    coordinates: [location.lng, location.lat], // GeoJSON format [lng, lat]
    lat: location.lat,
    lng: location.lng,
  };
};

/**
 * Get route information between two points
 * @param {object} startLocation - Start coordinates {lat, lng}
 * @param {object} endLocation - End coordinates {lat, lng}
 * @returns {object} Route information
 */
const getRouteInfo = (startLocation, endLocation) => {
  if (!startLocation || !endLocation || !startLocation.lat || !endLocation.lat) {
    return null;
  }

  const distance = calculateDistance(
    startLocation.lat,
    startLocation.lng,
    endLocation.lat,
    endLocation.lng
  );

  const travelTime = estimateTravelTime(distance);

  return {
    start: startLocation,
    end: endLocation,
    distance_km: parseFloat(distance.toFixed(2)),
    estimated_time_minutes: travelTime,
    route_url: `https://www.google.com/maps/dir/?api=1&origin=${startLocation.lat},${startLocation.lng}&destination=${endLocation.lat},${endLocation.lng}`,
  };
};

/**
 * Format scrap location with all necessary details
 * @param {object} scrapRequest - Scrap request document
 * @param {object} collectorLocation - Collector's location {lat, lng}
 * @returns {object} Complete location data
 */
const formatScrapLocationData = (scrapRequest, collectorLocation) => {
  if (!scrapRequest.pickup_location) {
    return null;
  }

  const scrapLocation = {
    address: scrapRequest.pickup_address,
    coordinates: formatLocation(scrapRequest.pickup_location),
    category: scrapRequest.category,
    quantity: scrapRequest.quantity_estimated,
    status: scrapRequest.status,
  };

  // Add route information if collector is assigned
  if (collectorLocation && scrapRequest.status === 'assigned') {
    scrapLocation.route = getRouteInfo(collectorLocation, scrapRequest.pickup_location);
  }

  return scrapLocation;
};

/**
 * Get nearby scraps for a collector
 * @param {object} collectorLocation - Collector's coordinates
 * @param {array} scraps - Array of scrap requests
 * @param {number} radiusKm - Search radius in km (default 5)
 * @returns {array} Scraps within radius, sorted by distance
 */
const getNearbysScraps = (collectorLocation, scraps, radiusKm = 5) => {
  if (!collectorLocation || !collectorLocation.lat) {
    return [];
  }

  return scraps
    .map((scrap) => {
      if (!scrap.pickup_location) return null;

      const distance = calculateDistance(
        collectorLocation.lat,
        collectorLocation.lng,
        scrap.pickup_location.lat,
        scrap.pickup_location.lng
      );

      return {
        ...scrap._doc || scrap,
        distance_km: parseFloat(distance.toFixed(2)),
        travel_time_minutes: estimateTravelTime(distance),
      };
    })
    .filter((scrap) => scrap && scrap.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
};

/**
 * Create map marker data for frontend
 * @param {object} scrap - Scrap request
 * @param {string} type - 'scrap' or 'collector'
 * @returns {object} Marker data for map visualization
 */
const createMapMarker = (scrap, type = 'scrap') => {
  if (!scrap.pickup_location && type === 'scrap') {
    return null;
  }

  const location = scrap.pickup_location || scrap.location;
  if (!location || !location.lat) {
    return null;
  }

  return {
    id: scrap._id,
    type,
    title: scrap.pickup_address || 'Scrap Location',
    lat: location.lat,
    lng: location.lng,
    description: scrap.category || 'Scrap',
    quantity: scrap.quantity_estimated,
    status: scrap.status,
    color: getMarkerColor(scrap.status),
    icon: getMarkerIcon(type, scrap.status),
  };
};

/**
 * Get marker color based on status
 * @param {string} status - Scrap status
 * @returns {string} Color code
 */
const getMarkerColor = (status) => {
  const colors = {
    pending: '#FFA500', // Orange
    approved: '#4CAF50', // Green
    assigned: '#2196F3', // Blue
    collected: '#9C27B0', // Purple
    completed: '#8BC34A', // Light Green
    rejected: '#F44336', // Red
    cancelled: '#757575', // Gray
  };
  return colors[status] || '#FFA500';
};

/**
 * Get marker icon based on type and status
 * @param {string} type - Marker type
 * @param {string} status - Status
 * @returns {string} Icon identifier
 */
const getMarkerIcon = (type, status) => {
  if (type === 'collector') return 'collector';
  if (status === 'assigned') return 'assigned';
  if (status === 'collected') return 'collected';
  return 'scrap';
};

module.exports = {
  calculateDistance,
  estimateTravelTime,
  formatLocation,
  getRouteInfo,
  formatScrapLocationData,
  getNearbysScraps,
  createMapMarker,
  getMarkerColor,
  getMarkerIcon,
};
