import { useState, useEffect, useCallback } from 'react';
import { MapPin, Trash2, Save, Download, Undo, Redo, Search, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { MapClickHandler } from '../MapClickHandler';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.service';
import { useWaypoints } from '../../hooks/useWaypoints';
import { calculateRouteDistance } from '../../utils/geo';
import styles from './RouteEditor.module.css';
import 'leaflet/dist/leaflet.css';

export const RouteEditor = ({ mode = 'create' }: { mode?: 'create' | 'edit' | 'view' }) => {
  const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [routeName, setRouteName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Waypoints Management
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
    loadRoute();
  }, [id, mode]);

  const loadRoute = async () => {
    if (mode !== 'create' && id) {
      try {
        const route = await ApiService.getRouteById(id);
        setRouteName(route.name);
        setIsPrivate(route.is_private);
        resetWaypoints(route.waypoints);
        if (route.waypoints.length > 0) {
          setMapCenter([route.waypoints[0].lat, route.waypoints[0].lng]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load route');
        navigate('/');
      }
    } else {
      resetWaypoints([]);
      setRouteName('');
      setIsPrivate(false);
      setMapCenter(DEFAULT_CENTER);
    }
  };

  // Save route handler with API call
  const handleSave = useCallback(async () => {
    if (!routeName.trim() || waypoints.length === 0) {
      setError('Route name and at least one waypoint are required');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      const routeData = {
        id: mode === 'create' ? undefined : id,
        name: routeName,
        waypoints,
        is_private: isPrivate,
        total_distance: calculateRouteDistance(waypoints),
        created_at: mode === 'create' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      };
      if (mode !== 'create' && id) {
        await ApiService.updateRoute(id, routeData);
      } else {
        await ApiService.createRoute(routeData);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  }, [routeName, waypoints, isPrivate, mode, id, navigate]);

  // Map click handler
  const handleMapClick = useCallback((e: { latlng: { lat: number; lng: number } }) => {
    if (mode === 'view') return; // Prevent adding waypoints in view mode
    addWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
  }, [addWaypoint]);

  // Location search handler
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (data?.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        resetWaypoints([]);
        setSearchQuery('');
      } else {
        setError('Location not found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching location');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, isSearching]);

  // Current location handler
  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationPrompt(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resetWaypoints([]);
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setLocationPrompt(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPrompt(false);
        setError('Unable to retrieve your location');
      }
    );
  }, []);

  // Derived values
  const totalDistance = calculateRouteDistance(waypoints);
  const isSaveDisabled = !routeName.trim() || waypoints.length === 0 || isSaving;

  return (
    <div className={styles.container}>
      {/* Sidebar Section */}
      <div className={styles.sidebar}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          ← Back to Routes
        </button>

        <div className={styles.header}>
          <MapPin size={24} />
          <span>{(mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View') + ' Route'}</span>
        </div>

        {/* Error Display */}
        {error && (
          <div className={styles.errorAlert}>
            <div className={styles.errorText}>{error}</div>
            <button 
              onClick={() => setError(null)}
              className={styles.errorCloseButton}
            >
              ×
            </button>
          </div>
        )}

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
          {mode === 'view' ? (
            <span className={styles.routeNameDisplay}>{routeName || 'Untitled Route'}</span>
          ) : (
            <input
              type="text"
              placeholder="Route name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className={styles.input}
            />
          )}
          
          {/* Privacy Toggle */}
          {mode !== 'view' && (
            <div className={styles.privacyToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(!isPrivate)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleText}>
                  {isPrivate ? 'Private Route' : 'Public Route'}
                </span>
              </label>
            </div>
          )}
          
          <div className={styles.buttonContainer}>
            {mode !== 'view' && (
              <button
                className={`${styles.button} ${styles.saveButton}`}
                onClick={handleSave}
                disabled={isSaveDisabled}
              >
                <Save size={16} /> 
                {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </button>
            )}
            <button
              className={`${styles.button} ${styles.exportButton}`}
              onClick={() => {
                const routeData = {
                  name: routeName || 'Unnamed Route',
                  waypoints,
                  isPrivate,
                  total_distance: totalDistance,
                  created_at: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `route_${Date.now()}.json`;
                a.click();
              }}
              disabled={waypoints.length === 0}
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>


        {/* Action Buttons */}
        {mode !== 'view' && (
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionButton} ${styles.undoButton}`}
              onClick={undo}
              disabled={!canUndo || isSaving}
              title="Undo last action"
            >
              <Undo size={16} />
            </button>
            <button
              className={`${styles.actionButton} ${styles.redoButton}`}
              onClick={redo}
              disabled={!canRedo || isSaving}
              title="Redo last action"
            >
              <Redo size={16} />
            </button>
            <button
              className={`${styles.actionButton} ${styles.clearButton}`}
              onClick={clearWaypoints}
              disabled={waypoints.length === 0 || isSaving}
              title="Clear all waypoints"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}


       {/* Search Section */}
      {mode !== 'view' && (
        <div className={styles.searchSection}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
              disabled={isSearching || isSaving}
            />
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={isSearching || !searchQuery.trim() || isSaving}
              title="Search location"
            >
              <Search size={16} />
            </button>
            <button
              onClick={handleUseLocation}
              className={styles.userLocationButton}
              disabled={isSaving}
              title="Use User location"
            >
              <Locate size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
      

      {/* Map Section */}
      <div className={styles.mapContainer} data-testid="map-container">
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