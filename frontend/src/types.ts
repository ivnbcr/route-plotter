export type LatLng = {
  lat: number;
  lng: number;
};

export type Waypoint = LatLng & {
  id: number;
  order: number;
};

export type SavedRoute = {
  name: string;
  waypoints: Waypoint[];
  total_distance: number;
  created_at: string;
};