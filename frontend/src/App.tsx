import { useState, useEffect } from 'react';
import { RouteList } from './components/RouteList/RouteList';
import { RouteEditor } from './components/RouteEditor/RouteEditor';
import { getDistanceBetweenPoints } from './ utilities';
import type { SavedRoute, Waypoint } from './types';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

export default function App() {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [history, setHistory] = useState<{
    past: Waypoint[][];
    future: Waypoint[][];
  }>({ past: [], future: [] });
  const [routeName, setRouteName] = useState('');
  const [savedRoutes, setSavedRoutes] = useState<{
    name: string;
    waypoints: Waypoint[];
    total_distance: number;
    created_at: string;
  }[]>([]);
  const [screen, setScreen] = useState<'list' | 'editor'>('list');
  const [totalDistance, setTotalDistance] = useState(0);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate distance between points
  const getDistanceBetweenPoints = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateSimpleDistance = (points: Waypoint[]) => {
    let totalDist = 0;
    for (let i = 1; i < points.length; i++) {
      totalDist += getDistanceBetweenPoints(points[i-1], points[i]);
    }
    setTotalDistance(totalDist);
  };

  // Update waypoints and maintain history
  const updateWaypoints = (newWaypoints: Waypoint[]) => {
    setHistory(prev => ({
      past: [...prev.past, waypoints],
      future: []
    }));
    setWaypoints(newWaypoints);
    calculateSimpleDistance(newWaypoints);
  };

  // Undo/Redo functionality
  const undoWaypoint = () => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        future: [waypoints, ...prev.future]
      };
    });
    const previousWaypoints = history.past[history.past.length - 1] || [];
    setWaypoints(previousWaypoints);
    calculateSimpleDistance(previousWaypoints);
  };

  const redoWaypoint = () => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, waypoints],
        future: prev.future.slice(1)
      };
    });
    const nextWaypoints = history.future[0] || [];
    setWaypoints(nextWaypoints);
    calculateSimpleDistance(nextWaypoints);
  };

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Waypoint handlers
  const handleMapClick = (e: { latlng: { lat: number; lng: number } }) => {
    updateWaypoints([
      ...waypoints,
      {
        id: Date.now(),
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        order: waypoints.length
      }
    ]);
  };

  const removeWaypoint = (id: number) => {
    updateWaypoints(waypoints.filter(w => w.id !== id));
  };

  const clearRoute = () => {
    updateWaypoints([]);
  };

  const setMapLocation = (center: [number, number]) => {
    clearRoute
    setMapCenter(center);
  }
    

  // Route management
  const saveRoute = () => {
    if (!routeName.trim() || waypoints.length === 0) return;
    const savedRoute = {
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
    const routeData = {
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

  // Location handling
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
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
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
    setLocationPrompt(false);
  };

  // Prompt for location on first load
  useEffect(() => {
    if (mapCenter[0] === DEFAULT_CENTER[0] && mapCenter[1] === DEFAULT_CENTER[1]) {
      setLocationPrompt(true);
    }
  }, [mapCenter]);

  useEffect(() => {
    if (waypoints.length > 1) {
      calculateSimpleDistance(waypoints);
    } else {
      setTotalDistance(0);
    }
  }, [waypoints]);

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
          mapCenter={mapCenter}
          onBack={() => setScreen('list')}
          setRouteName={setRouteName}
          saveRoute={saveRoute}
          exportRoute={exportRoute}
          clearRoute={clearRoute}
          removeWaypoint={removeWaypoint}
          handleMapClick={handleMapClick}
          undoWaypoint={undoWaypoint}
          redoWaypoint={redoWaypoint}
          canUndo={canUndo}
          canRedo={canRedo}
          setMapCenter={setMapLocation}
        />
      )}
    </div>
  );
}