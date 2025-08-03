import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Trash2, Save, Download, Undo, Redo, Search, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { MapClickHandler } from '../MapClickHandler';
import styles from './RouteEditor.module.css';
import { useWaypoints } from '../../hooks/useWaypoints';
import { calculateRouteDistance } from '../../utils/geo';
import { useParams, useNavigate } from 'react-router-dom';
import type { SavedRoute } from '../../types';
import 'leaflet/dist/leaflet.css';

type RouteEditorProps = {
  routes: SavedRoute[];
  onSave: (route: SavedRoute) => void;
  onBack: () => void;
  onSearch?: (query: string) => Promise<boolean>;
  mode?: 'create' | 'edit';
};

export const RouteEditor = ({ 
  routes,
  onSave,
  onBack,
  onSearch,
  mode = 'create'
}: RouteEditorProps) => {
  const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
  const { id } = useParams();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  
  // State Management
  const [routeName, setRouteName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  // Custom Hooks
  const { 
    waypoints, 
    addWaypoint, 
    clearWaypoints,
    resetWaypoints, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useWaypoints();

  // Load route when editing
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      if (mode === 'edit' && id) {
        const route = routes.find(r => r.id === id);
        if (route) {
          setRouteName(route.name);
          resetWaypoints(route.waypoints);
          if (route.waypoints.length > 0) {
            setMapCenter([route.waypoints[0].lat, route.waypoints[0].lng]);
          }
        }
      } else {
        resetWaypoints([]);
        setRouteName('');
        setMapCenter(DEFAULT_CENTER);
      }
      setSearchQuery('');
    }
  }, [id, mode, routes, resetWaypoints, setMapCenter]);

  // Handlers
  const handleMapClick = useCallback((e: { latlng: { lat: number; lng: number } }) => {
    addWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
  }, [addWaypoint]);

  const handleSave = useCallback(() => {
    if (!routeName.trim() || waypoints.length === 0) return;
    
    onSave({
      id: id || Date.now().toString(),
      name: routeName,
      waypoints,
      total_distance: calculateRouteDistance(waypoints),
      created_at: mode === 'create' ? new Date().toISOString() : routes.find(r => r.id === id)?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    navigate('/');
  }, [routeName, waypoints, id, mode, routes, onSave, navigate]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (data?.length > 0) {
        resetWaypoints([]);
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setSearchQuery('');
      } else {
        alert('Location not found');
        if (onSearch) await onSearch(searchQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching location');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, isSearching, resetWaypoints, setMapCenter, onSearch]);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocationPrompt(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setLocationPrompt(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPrompt(false);
        alert('Unable to retrieve your location.');
      }
    );
  }, [setMapCenter]);

  // Derived values
  const totalDistance = calculateRouteDistance(waypoints);
  const isSaveDisabled = !routeName.trim() || waypoints.length === 0;
  const isExportDisabled = waypoints.length === 0;
  const waypointCount = waypoints.length;

  return (
    <div className={styles.container}>
      {/* Sidebar Section */}
      <div className={styles.sidebar}>
        <button onClick={() => {navigate(`/`); }} className={styles.backButton}>
          ← Back to Routes
        </button>

        <div className={styles.header}>
          <MapPin size={24} />
          <span>{mode === 'create' ? 'Create Route' : 'Edit Route'}</span>
        </div>

        {/* Distance Card */}
        <div className={styles.distanceCard}>
          <div className={styles.distanceHeader}>
            <span className={styles.distanceLabel}>Total Distance</span>
            <span className={styles.distanceValue}>
              {totalDistance.toFixed(2)} km
            </span>
          </div>
          <div className={styles.distanceSubtext}>
            Calculated as straight lines between waypoints
          </div>
        </div>

        {/* Route Name Input */}
        <div className={styles.inputSection}>
          <input
            type="text"
            placeholder="Route name"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            className={styles.input}
          />
          <div className={styles.buttonContainer}>
            <button
              className={`${styles.button} ${styles.saveButton}`}
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              <Save size={16} /> {mode === 'create' ? 'Create' : 'Update'}
            </button>
            <button
              className={`${styles.button} ${styles.exportButton}`}
              onClick={() => {
                const routeData = {
                  name: routeName || 'Unnamed Route',
                  waypoints,
                  total_distance: totalDistance,
                  created_at: new Date().toISOString()
                };
                exportToJsonFile(routeData, `route_${Date.now()}.json`);
              }}
              disabled={isExportDisabled}
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionButton} ${styles.undoButton}`}
            onClick={undo}
            disabled={!canUndo}
            title="Undo last action"
          >
            <Undo size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.redoButton}`}
            onClick={redo}
            disabled={!canRedo}
            title="Redo last action"
          >
            <Redo size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.clearButton}`}
            onClick={clearWaypoints}
            disabled={waypoints.length === 0}
            title="Clear all waypoints"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Search Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={isSearching || !searchQuery.trim()}
              title="Search location"
            >
              <Search size={16} />
            </button>

            <button
              onClick={handleUseLocation}
              className={styles.userLocationButton}
              title="Use User location"
            >
              <Locate size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className={styles.mapContainer}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          className={styles.map}
          key={`${mapCenter[0]}-${mapCenter[1]}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {waypoints.map((wp) => (
            <Marker key={wp.id} position={[wp.lat, wp.lng]} />
          ))}
          {waypoints.length > 1 && (
            <Polyline
              positions={waypoints.map(wp => [wp.lat, wp.lng])}
              pathOptions={{ color: '#3b82f6', weight: 4 }}
            />
          )}
        </MapContainer>

        {locationPrompt && (
          <div className={styles.locationPromptOverlay}>
            <div className={styles.locationPromptContent}>
              <div className={styles.locationPromptSpinner}></div>
              <p className={styles.locationPromptText}>Finding your location...</p>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className={styles.instructions}>
          <div className={styles.instructionsTitle}>Instructions</div>
          <ul className={styles.instructionsList}>
            <li>Click on the map to add waypoints</li>
            <li>Waypoints connect in order added</li>
            <li>{mode === 'create' ? 'Save' : 'Update'} or export when done</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Helper function
const exportToJsonFile = (data: object, filename: string) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', filename);
  linkElement.click();
};