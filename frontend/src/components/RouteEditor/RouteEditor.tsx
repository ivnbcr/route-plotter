import { MapPin, Trash2, Save, Download, Undo, Redo, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { MapClickHandler } from '../MapClickHandler';
import type { Waypoint } from '../../types';
import styles from './RouteEditor.module.css';
import { useState } from 'react';

type Props = {
  waypoints: Waypoint[];
  routeName: string;
  totalDistance: number;
  mapCenter: [number, number];
  onBack: () => void;
  setRouteName: (name: string) => void;
  saveRoute: () => void;
  exportRoute: () => void;
  clearRoute: () => void;
  removeWaypoint: (id: number) => void;
  handleMapClick: (e: { latlng: { lat: number; lng: number } }) => void;
  undoWaypoint: () => void;
  redoWaypoint: () => void;
  canUndo: boolean;
  canRedo: boolean;
  setMapCenter: (center: [number, number]) => void;
};

export const RouteEditor = ({
  waypoints,
  routeName,
  totalDistance,
  mapCenter,
  onBack,
  setRouteName,
  saveRoute,
  exportRoute,
  clearRoute,
  removeWaypoint,
  handleMapClick,
  undoWaypoint,
  redoWaypoint,
  canUndo,
  canRedo,
  setMapCenter // Add this to destructured props
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const firstResult = data[0];
        const newCenter: [number, number] = [
          parseFloat(firstResult.lat),
          parseFloat(firstResult.lon)
        ];
        setMapCenter(newCenter);
      }
    } catch (error) {
      console.error('Error during geocoding:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Routes
        </button>

        <div className={styles.header}>
          <MapPin size={24} />
          <span>Route Editor</span>
        </div>

        <div className={styles.distanceCard}>
          <div className={styles.distanceHeader}>
            <span className={styles.distanceLabel}>Total Distance</span>
            <span className={styles.distanceValue}>{totalDistance.toFixed(2)} km</span>
          </div>
          <div className={styles.distanceSubtext}>
            Calculated as straight lines between waypoints.
          </div>
        </div>

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
              onClick={saveRoute}
              disabled={!routeName.trim() || waypoints.length === 0}
            >
              <Save size={16} /> Save
            </button>
            <button
              className={`${styles.button} ${styles.exportButton}`}
              onClick={exportRoute}
              disabled={waypoints.length === 0}
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionButton} ${styles.undoButton}`}
            onClick={undoWaypoint}
            disabled={!canUndo}
            title="Undo last action"
          >
            <Undo size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.redoButton}`}
            onClick={redoWaypoint}
            disabled={!canRedo}
            title="Redo last action"
          >
            <Redo size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.clearButton}`}
            onClick={clearRoute}
            disabled={waypoints.length === 0}
            title="Clear all waypoints"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Search Input */}
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
          </div>
        </div>

        {/* Waypoint Count Display */}
        {waypoints.length > 0 && (
          <div className={styles.waypointCount}>
            {waypoints.length} point{waypoints.length !== 1 ? 's' : ''} on map
          </div>
        )}
      </div>

      <div className={styles.mapContainer}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          className={styles.map}
          key={`${mapCenter[0]}-${mapCenter[1]}`} // This forces remount when center changes
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
        <div className={styles.instructions}>
          <div className={styles.instructionsTitle}>Instructions</div>
          <ul className={styles.instructionsList}>
            <li>Click on the map to add waypoints</li>
            <li>Waypoints connect in order added</li>
            <li>Save or export when done</li>
          </ul>
        </div>
      </div>
    </div>
  );
};