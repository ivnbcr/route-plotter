import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.service';
import type { SavedRoute } from '../../types';
import styles from './RouteList.module.css';
import { useAuth } from '../../context/AuthContext';
import { RouteRow } from './RouteRow';
import { SortControls, type SortKey } from './SortControls';

const getLatLngFromSearch = async (query: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.length > 0) {
    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  }
  return null;
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const RouteList = () => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primarySort, setPrimarySort] = useState<SortKey>('created_at');
  const [primaryOrder, setPrimaryOrder] = useState<'asc' | 'desc'>('asc');
  const [secondarySort, setSecondarySort] = useState<SortKey>('');
  const [secondaryOrder, setSecondaryOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setIsLoading(true);
        const data = await ApiService.getRoutes({
          sort_key: primarySort,
          sort_order: primaryOrder,
          secondary_sort_key: secondarySort || undefined,
          secondary_sort_order: secondarySort ? secondaryOrder : undefined,
        });
        setRoutes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load routes');
        console.error('Error fetching routes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, [primarySort, primaryOrder, secondarySort, secondaryOrder]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setSearchCoords(null);
        setSearchLoading(false); 
        return;
      }

      setSearchLoading(true);

      try {
        const coords = await getLatLngFromSearch(searchTerm);
        setSearchCoords(coords);
      } finally {
        setSearchLoading(false); 
      }
    }, 500);

    return () => {
      clearTimeout(delayDebounce);
      setSearchLoading(false); 
    };
  }, [searchTerm]);



  const handleNewRoute = () => {
    navigate('/routes/new');
  };

  const handleDeleteRoute = async (routeId: number) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;

    try {
      setIsLoading(true);
      await ApiService.deleteRoute(routeId);
      setRoutes(prev => prev.filter(route => route.id !== routeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete route');
      console.error('Error deleting route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickRoute = (routeId: number, isOwner: boolean) => {
    navigate(isOwner ? `/routes/${routeId}` : `/routes/${routeId}/view`);
  };

  const nameMatches = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nearbyMatches = searchCoords
    ? routes.filter(route =>
        route.waypoints?.some(wp =>
          haversineDistance(wp.lat, wp.lng, searchCoords.lat, searchCoords.lng) <= 5
        )
      )
    : [];

  const filteredRoutes = Array.from(
    new Map([...nameMatches, ...nearbyMatches].map(route => [route.id, route])).values()
  );

  if (isLoading && routes.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading routes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorAlert}>
          <h3>Error loading routes</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Saved Routes</h2>
        <button
          className={styles.createButton}
          onClick={handleNewRoute}
          disabled={isLoading}
        >
          Create New Route
        </button>
        <button
          className={styles.refreshButton}
          onClick={() => window.location.reload()}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <SortControls
        primarySort={primarySort}
        primaryOrder={primaryOrder}
        secondarySort={secondarySort}
        secondaryOrder={secondaryOrder}
        onPrimarySortChange={setPrimarySort}
        onPrimaryOrderChange={setPrimaryOrder}
        onSecondarySortChange={setSecondarySort}
        onSecondaryOrderChange={setSecondaryOrder}
      />

     {searchLoading ? (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    ) : filteredRoutes.length === 0 ? (
      <div className={styles.emptyState}>
        <p>No routes match your search.</p>
      </div>
    ) : (
      <ul className={styles.routeList}>
        {filteredRoutes.map((route) => {
          const isOwner = route.user_id === user?.id;
          return (
            <li key={route.id}>
              <RouteRow
                id={route.id}
                name={route.name}
                distance={route.total_distance}
                createdAt={new Date(route.created_at).toLocaleDateString()}
                isPrivate={route.is_private}
                isOwner={isOwner}
                onDelete={() => handleDeleteRoute(route.id)}
                onClick={() => handleClickRoute(route.id, isOwner)}
              />
            </li>
          );
        })}
      </ul>
    )}

    </div>
  );
};
