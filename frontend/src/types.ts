/**
 * Geographic coordinate point
 */
export type LatLng = {
  lat: number;
  lng: number;
};

/**
 * Waypoint with additional metadata
 */
export type Waypoint = LatLng & {
  id: number;       // Unique identifier for the waypoint
  order: number;    // Sequence in the route
};

/**
 * Complete route definition
 */
export type SavedRoute = {
  id: string;                     // Unique identifier (required for routing)
  name: string;                   // Human-readable name
  waypoints: Waypoint[];          // Array of waypoints
  total_distance: number;         // Calculated distance in kilometers
  created_at: string;             // ISO 8601 creation timestamp
  updated_at: string;             // Last modification timestamp
};

/**
 * Lightweight route representation for lists
 */
export type RouteSummary = Pick<SavedRoute, 'id' | 'name' | 'total_distance'> & {
  created_date: string;         // Formatted date only (e.g. "2023-08-15")
  waypoint_count: number;       // Number of waypoints
};

/**
 * New route creation payload
 */
export type NewRouteParams = Omit<SavedRoute, 'id' | 'created_at' | 'updated_at'>;

/**
 * Route update payload
 */
export type UpdateRouteParams = Partial<NewRouteParams> & {
  id: string;                  // Required for updates
};

/**
 * API Response Types
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Authentication Types
 */
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type AuthenticatedUser = User & {
  token: string;
};

/**
 * Editor Component Props
 */
export interface RouteEditorProps {
  mode: 'create' | 'edit';
  route?: SavedRoute;
  onSave: (route: SavedRoute) => void;
  onCancel: () => void;
}