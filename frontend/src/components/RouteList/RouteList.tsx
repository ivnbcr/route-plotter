import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.service';
import type { SavedRoute } from '../../types';
import styles from './RouteList.module.css';
import { useAuth } from '../../context/AuthContext';
import { RouteRow } from './RouteRow';
import { SortControls, type SortKey } from './SortControls';

export const RouteList = () => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primarySort, setPrimarySort] = useState<SortKey>('created_at');
  const [primaryOrder, setPrimaryOrder] = useState<'asc' | 'desc'>('asc');
  const [secondarySort, setSecondarySort] = useState<SortKey>('');
  const [secondaryOrder, setSecondaryOrder] = useState<'asc' | 'desc'>('asc');
  

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
    if (isOwner) {
      navigate(`/routes/${routeId}`);
    } else {
      navigate(`/routes/${routeId}/view`);
    }
  };

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
          className={styles.refreshButton}
          onClick={() => window.location.reload()}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* Sort Controls */}
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


      {routes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No routes saved yet.</p>
          <button
            className={styles.createButton}
            onClick={handleNewRoute}
          >
            Create your first route
          </button>
        </div>
      ) : (
        <ul className={styles.routeList}>
          {routes.map((route) => {
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
                  onDelete={(id) => handleDeleteRoute(id)}
                  onClick={(id) => handleClickRoute(id, isOwner)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {routes.length > 0 && (
        <button
          className={styles.createButton}
          onClick={handleNewRoute}
          disabled={isLoading}
        >
          Create New Route
        </button>
      )}
    </div>
  );
};
