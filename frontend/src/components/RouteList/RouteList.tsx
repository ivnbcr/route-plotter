import { useNavigate } from 'react-router-dom';
import type { SavedRoute } from '../../types';
import styles from './RouteList.module.css';

interface Props {
  routes: SavedRoute[];
  className?: string;
}

export const RouteList = ({ routes, className = '' }: Props) => {
  const navigate = useNavigate();

  /**
   * Handles route editing navigation
   * @param routeId - ID of the route to edit
   */
  const handleEditRoute = (routeId: string) => {
    navigate(`/routes/${routeId}`);
  };

  /**
   * Handles new route creation
   */
  const handleNewRoute = () => {
    navigate('/routes/new');
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>Saved Routes</h2>
      </header>

      {routes.length === 0 ? (
        <div className={styles.emptyState}>
          No routes saved yet. Create your first route to get started.
        </div>
      ) : (
        <ul className={styles.routeList}>
          {routes.map((route) => (
            <li key={route.id} className={styles.listItem}>
              <div className={styles.routeInfo}>
                <h3 className={styles.routeName}>{route.name}</h3>
                <div className={styles.routeMeta}>
                  <span className={styles.distance}>
                    {route.total_distance.toFixed(2)} km
                  </span>
                  <span className={styles.waypointCount}>
                    {route.waypoints.length} points
                  </span>
                </div>
              </div>
              <button
                className={styles.editButton}
                onClick={() => handleEditRoute(route.id)}
                aria-label={`Edit route ${route.name}`}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        className={styles.newRouteButton}
        onClick={handleNewRoute}
        aria-label="Create new route"
      >
        Create New Route
      </button>
    </div>
  );
};