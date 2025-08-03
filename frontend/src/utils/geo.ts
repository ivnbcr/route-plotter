import type { Waypoint } from '../types';

export const calculateRouteDistance = (waypoints: Waypoint[]): number => {
  if (waypoints.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalDistance += getDistanceBetweenPoints(waypoints[i-1], waypoints[i]);
  }
  return parseFloat(totalDistance.toFixed(2));
};

const getDistanceBetweenPoints = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * 
    Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};