import React, { useState, useEffect } from 'react';
import { MapPin, Trash2, Save, Download } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type LatLng = {
  lat: number;
  lng: number;
};

type Waypoint = LatLng & {
  id: number;
  order: number;
};

type SavedRoute = {
  name: string;
  waypoints: Waypoint[];
  total_distance: number;
  created_at: string;
};

type MapClickHandlerProps = {
  onMapClick: (e: { latlng: LatLng }) => void;
};

type RouteListProps = {
  routes: SavedRoute[];
  onEdit: (routeIdx: number | null) => void;
};

type RouteEditorProps = {
  waypoints: Waypoint[];
  routeName: string;
  totalDistance: number;
  onBack: () => void;
};

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842]; // Manila

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e);
    },
  });
  return null;
}

const RoutePlotterApp = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [routeName, setRouteName] = useState<string>('');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [locationPrompt, setLocationPrompt] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [waypointSearch, setWaypointSearch] = useState<string>('');
  const [matchingWaypoints, setMatchingWaypoints] = useState<Waypoint[]>([]);
  const [screen, setScreen] = useState<'list' | 'editor'>('list');

  const SEARCH_RADIUS_KM = 42; // 1 km radius

  // Prompt for location on first load
  useEffect(() => {
    if (mapCenter[0] === DEFAULT_CENTER[0] && mapCenter[1] === DEFAULT_CENTER[1]) {
      setLocationPrompt(true);
    }
  }, [mapCenter]);

  const handleUseLocation = () => {
    setLocationPrompt(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          alert('Unable to retrieve your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert('Location not found.');
      }
    } catch {
      alert('Error searching location.');
    }
    setSearchLoading(false);
    setLocationPrompt(false);
  };

  const handleWaypointSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waypointSearch.trim()) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(waypointSearch)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const matches = waypoints.filter(wp => {
          const dist = getDistanceBetweenPoints({lat, lng}, wp);
          return dist <= SEARCH_RADIUS_KM;
        });
        setMatchingWaypoints(matches);
      } else {
        setMatchingWaypoints([]);
        alert('Place not found.');
      }
    } catch {
      setMatchingWaypoints([]);
      alert('Error searching place.');
    }
  };

  const handleMapClick = (e: { latlng: LatLng }) => {
    setWaypoints(prevWaypoints => {
      const newWaypoint: Waypoint = {
        id: Date.now(),
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        order: prevWaypoints.length
      };
      const updatedWaypoints = [...prevWaypoints, newWaypoint];
      calculateSimpleDistance(updatedWaypoints);
      return updatedWaypoints;
    });
  };

  const calculateSimpleDistance = (points: Waypoint[]) => {
    let totalDist = 0;
    for (let i = 1; i < points.length; i++) {
      totalDist += getDistanceBetweenPoints(points[i-1], points[i]);
    }
    setTotalDistance(totalDist);
  };

  const getDistanceBetweenPoints = (point1: LatLng, point2: LatLng) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const removeWaypoint = (waypointId: number) => {
    const updatedWaypoints = waypoints.filter(w => w.id !== waypointId);
    setWaypoints(updatedWaypoints);
    calculateSimpleDistance(updatedWaypoints);
  };

  const clearRoute = () => {
    setWaypoints([]);
    setTotalDistance(0);
  };

  const saveRoute = () => {
    if (!routeName.trim() || waypoints.length === 0) return;
    const savedRoute: SavedRoute = {
      name: routeName,
      waypoints: waypoints,
      total_distance: totalDistance,
      created_at: new Date().toISOString()
    };
    setSavedRoutes([...savedRoutes, savedRoute]);
    setRouteName('');
    alert('Route saved locally!');
  };

  const exportRoute = () => {
    const routeData: SavedRoute = {
      name: routeName || 'Unnamed Route',
      waypoints: waypoints,
      total_distance: totalDistance,
      created_at: new Date().toISOString()
    };
    const dataStr = JSON.stringify(routeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `route_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const RouteList = ({ routes, onEdit }: RouteListProps) => (
    <div style={{ padding: 32, height: '100%' }}>
      <h2>Saved Routes</h2>
      {routes.length === 0 ? (
        <div>No routes saved yet.</div>
      ) : (
        <ul>
          {routes.map((route, idx) => (
            <li key={idx} style={{ marginBottom: 16 }}>
              <strong>{route.name}</strong> — {route.total_distance.toFixed(2)} km
              <button style={{ marginLeft: 16 }} onClick={() => onEdit(idx)}>
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
      <button style={{ marginTop: 32 }} onClick={() => onEdit(null)}>
        Create New Route
      </button>
    </div>
  );

  const RouteEditor = ({
    waypoints,
    routeName,
    totalDistance,
    onBack
  }: RouteEditorProps) => {
    return (
      <div style={{ ...styles.container, height: '100vh' }}>
        <div style={styles.sidebar}>
          <button onClick={onBack} style={{ marginBottom: 16 }}>
            ← Back to Routes
          </button>
          <div style={styles.header}>
            <MapPin size={24} />
            Route Editor
          </div>
          <div style={styles.distanceCard}>
            <div style={styles.distanceHeader}>
              <span style={styles.distanceLabel}>Total Distance</span>
              <span style={styles.distanceValue}>{totalDistance.toFixed(2)} km</span>
            </div>
            <div style={styles.distanceSubtext}>
              Calculated as straight lines between waypoints.
            </div>
          </div>
          <div style={styles.inputSection}>
            <input
              type="text"
              placeholder="Route name"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
              style={styles.input}
            />
            <div style={styles.buttonContainer}>
              <button
                style={{ ...styles.button, ...styles.saveButton }}
                onClick={saveRoute}
              >
                <Save size={16} /> Save
              </button>
              <button
                style={{ ...styles.button, ...styles.exportButton }}
                onClick={exportRoute}
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>
          <div style={styles.waypointSection}>
            <div style={styles.waypointHeader}>
              <span style={styles.waypointTitle}>Waypoints</span>
              <button
                style={styles.clearButton}
                onClick={clearRoute}
                disabled={waypoints.length === 0}
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
            <div style={styles.waypointList}>
              {waypoints.length === 0 ? (
                <div style={styles.emptyState}>No waypoints added yet.</div>
              ) : (
                waypoints.map((wp, idx) => (
                  <div key={wp.id} style={styles.waypointItem}>
                    <div style={styles.waypointInfo}>
                      <div style={styles.waypointName}>Point {idx + 1}</div>
                      <div style={styles.waypointCoords}>
                        {wp.lat.toFixed(6)}, {wp.lng.toFixed(6)}
                      </div>
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeWaypoint(wp.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div style={{ ...styles.mapContainer, height: '100vh' }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ ...styles.map, height: '100%' }}
            whenCreated={(map) => {
              map.on('moveend', () => {
                setMapCenter([map.getCenter().lat, map.getCenter().lng]);
              });
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {waypoints.map((wp, idx) => (
              <Marker
                key={wp.id}
                position={[wp.lat, wp.lng]}
              />
            ))}
            {waypoints.length > 1 && (
              <Polyline
                positions={waypoints.map(wp => [wp.lat, wp.lng])}
                pathOptions={{ color: '#3b82f6', weight: 4 }}
              />
            )}
          </MapContainer>
          <div style={styles.instructions}>
            <div style={styles.instructionsTitle}>Instructions</div>
            <ul style={styles.instructionsList}>
              <li>Click on the map to add waypoints.</li>
              <li>Waypoints are connected in the order added.</li>
              <li>Save or export your route when done.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const styles = {
    container: {
      display: 'flex',
      width: '100vw',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    },
    sidebar: {
      width: '320px',
      minWidth: '320px',
      backgroundColor: 'white',
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      padding: '20px',
      overflowY: 'auto',
      borderRight: '1px solid #ddd',
      height: '100vh'
    },
    header: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    distanceCard: {
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: '#e3f2fd',
      borderRadius: '8px',
      border: '1px solid #bbdefb'
    },
    distanceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    distanceLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#666'
    },
    distanceValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1976d2'
    },
    distanceSubtext: {
      fontSize: '14px',
      color: '#666'
    },
    inputSection: {
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      marginBottom: '8px',
      boxSizing: 'border-box'
    },
    buttonContainer: {
      display: 'flex',
      gap: '8px'
    },
    button: {
      flex: 1,
      padding: '10px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      transition: 'background-color 0.2s'
    },
    saveButton: {
      backgroundColor: '#4caf50',
      color: 'white'
    },
    exportButton: {
      backgroundColor: '#9c27b0',
      color: 'white'
    },
    waypointSection: {
      marginBottom: '16px'
    },
    waypointHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    waypointTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333'
    },
    clearButton: {
      color: '#f44336',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    waypointList: {
      maxHeight: '250px',
      overflowY: 'auto'
    },
    waypointItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      backgroundColor: '#f5f5f5',
      borderRadius: '6px',
      marginBottom: '8px'
    },
    waypointInfo: {
      flex: 1
    },
    waypointName: {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '4px'
    },
    waypointCoords: {
      fontSize: '12px',
      color: '#666'
    },
    removeButton: {
      color: '#f44336',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '32px 0',
      color: '#666'
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
      minWidth: 0,
      minHeight: 0,
      overflow: 'hidden'
    },
    map: {
      width: '100%',
      height: '100%'
    },
    instructions: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '300px',
      zIndex: 1000
    },
    instructionsTitle: {
      fontWeight: '600',
      fontSize: '14px',
      marginBottom: '8px'
    },
    instructionsList: {
      fontSize: '12px',
      color: '#666',
      lineHeight: '1.4'
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid #1976d2',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {screen === 'list' ? (
        <RouteList
          routes={savedRoutes}
          onEdit={(routeIdx) => {
            if (routeIdx !== null) {
              const route = savedRoutes[routeIdx];
              setWaypoints(route.waypoints);
              setRouteName(route.name);
              setTotalDistance(route.total_distance);
            } else {
              setWaypoints([]);
              setRouteName('');
              setTotalDistance(0);
            }
            setScreen('editor');
          }}
        />
      ) : (
        <RouteEditor
          waypoints={waypoints}
          routeName={routeName}
          totalDistance={totalDistance}
          onBack={() => setScreen('list')}
        />
      )}
    </div>
  );
};

export default RoutePlotterApp;