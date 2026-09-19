/**
 * MEDISYNC - LOCATION & TRANSIT SERVICE
 * Real-time geolocation simulation, transit speed calculations, and traffic alert engine.
 */

class LocationService {
  constructor() {
    this.enabled = true;
    this.distanceMeters = 650; // default 650 meters away
    this.travelMode = 'walking'; // 'walking', 'driving', 'transit'
    this.trafficCondition = 'clear'; // 'clear', 'moderate', 'heavy'
    this.hospitalLat = 13.0827;
    this.hospitalLng = 80.2707;
    this.currentLat = 13.0850;
    this.currentLng = 80.2730;

    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    const data = this.getLocationMetrics();
    this.listeners.forEach(cb => cb(data));
  }

  setDistance(meters) {
    this.distanceMeters = parseInt(meters);
    this.notify();
  }

  setTravelMode(mode) {
    this.travelMode = mode;
    this.notify();
  }

  setTraffic(condition) {
    this.trafficCondition = condition;
    this.notify();
  }

  // Requests real browser Geolocation permission if user clicks
  requestGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentLat = pos.coords.latitude;
          this.currentLng = pos.coords.longitude;
          // Calculate approx distance from hospital using Haversine formula
          const dist = this.calculateHaversineDistance(
            this.currentLat, this.currentLng,
            this.hospitalLat, this.hospitalLng
          );
          this.distanceMeters = Math.round(dist * 1000);
          this.enabled = true;
          this.notify();
        },
        (err) => {
          console.log('Geolocation permission denied or unavailable, using simulation.');
        }
      );
    }
  }

  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getLocationMetrics() {
    // Base speed in m/s
    let baseSpeedMps = 1.4; // walking ~ 5 km/h
    if (this.travelMode === 'driving') baseSpeedMps = 7.0; // ~25 km/h
    if (this.travelMode === 'transit') baseSpeedMps = 5.0; // ~18 km/h

    // Traffic Multipliers
    let trafficMultiplier = 1.0;
    if (this.trafficCondition === 'moderate') trafficMultiplier = 1.35;
    if (this.trafficCondition === 'heavy') trafficMultiplier = 1.85;

    // Calculate Travel Time in Minutes
    let travelSeconds = (this.distanceMeters / baseSpeedMps) * trafficMultiplier;
    let travelTimeMinutes = Math.max(1, Math.round(travelSeconds / 60));

    // Traffic Alert Text
    let trafficWarning = '';
    if (this.trafficCondition === 'heavy') {
      trafficWarning = '🚨 Heavy traffic congestion detected on hospital route. Please add 10 mins buffer or leave immediately!';
    } else if (this.trafficCondition === 'moderate') {
      trafficWarning = '⚠️ Moderate traffic delay detected (+3-5 mins).';
    }

    return {
      enabled: this.enabled,
      distanceMeters: this.distanceMeters,
      distanceKm: (this.distanceMeters / 1000).toFixed(2),
      travelMode: this.travelMode,
      trafficCondition: this.trafficCondition,
      trafficMultiplier: trafficMultiplier,
      travelTimeMinutes: travelTimeMinutes,
      trafficWarning: trafficWarning
    };
  }
}

window.locationService = new LocationService();
