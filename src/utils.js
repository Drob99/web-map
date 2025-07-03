/**
 * @module utils
 * @description Utility functions for time, math, and string operations.
 */

/**
 * Returns the current Unix time in seconds.
 * @returns {number}
 */
export function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Converts degrees to radians.
 * @param {number} degrees - Angle in degrees.
 * @returns {number}
 */
export function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the distance between two geographic points using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} Distance in meters.
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  let dLat = deg2rad(lat2 - lat1);
  let dLon = deg2rad(lon2 - lon1);
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c; // Distance in kilometers
  return d * 1000;
}

/**
 * Performs a case-insensitive substring match.
 * @param {string} term - Search term.
 * @param {string} candidate - Candidate string to test.
 * @returns {boolean}
 */
export function stringMatch(term, candidate) {
  return (
    typeof candidate === "string" &&
    candidate.toLowerCase().includes(term.toLowerCase())
  );
}

/**
 * Calculates the bearing between two coordinates.
 * @param {[number, number]} start - [longitude, latitude] of the start point.
 * @param {[number, number]} end - [longitude, latitude] of the end point.
 * @returns {number} Bearing in degrees (0-360).
 */
export function calculateBearing(start, end) {
  try {
    const startLat = (parseFloat(start[1]) * Math.PI) / 180;
    const startLng = (parseFloat(start[0]) * Math.PI) / 180;
    const endLat = (parseFloat(end[1]) * Math.PI) / 180;
    const endLng = (parseFloat(end[0]) * Math.PI) / 180;
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return bearing < 0 ? bearing + 360 : bearing;
  } catch (error) {
    console.error("Error calculating bearing:", error);
    return 0;
  }
}

/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * @param {[number, number]} start - [longitude, latitude] of the start point.
 * @param {[number, number]} end - [longitude, latitude] of the end point.
 * @returns {number} Distance in meters.
 */
export function calculateDistance(start, end) {
  try {
    const R = 6371000; // Earth radius in meters
    const lat1 = (parseFloat(start[1]) * Math.PI) / 180;
    const lat2 = (parseFloat(end[1]) * Math.PI) / 180;
    const dLat = (parseFloat(end[1]) - parseFloat(start[1])) * (Math.PI / 180);
    const dLng = (parseFloat(end[0]) - parseFloat(start[0])) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 0;
  }
}

/**
 * Formats a distance in meters into a human-readable string.
 * @param {number} distance - Distance in meters.
 * @returns {string} Formatted distance string.
 */
export function formatDistance(distance) {
  if (distance < 10) {
    return `${Math.round(distance)} meters`;
  }
  if (distance < 1000) {
    return `${Math.round(distance / 10) * 10} meters`;
  }
  return `${(distance / 1000).toFixed(1)} kilometers`;
}