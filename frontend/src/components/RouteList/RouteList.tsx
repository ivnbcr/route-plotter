import type { SavedRoute } from '../../types';
import styles from './RouteList.module.css';

export interface Props {
  routes: SavedRoute[];
  onEdit: (routeIdx: number | null) => void;
}

export const RouteList = ({ routes, onEdit }: Props) => (
  <div className={styles.container}>
    <h2>Saved Routes</h2>
    {routes.length === 0 ? (
      <div>No routes saved yet.</div>
    ) : (
      <ul className={styles.routeList}>
        {routes.map((route, idx) => (
          <li key={idx} className={styles.listItem}>
            <div className={styles.routeInfo}>
              <strong>{route.name}</strong> — {route.total_distance.toFixed(2)} km
            </div>
            <button 
              className={styles.editButton}
              onClick={() => onEdit(idx)}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    )}
    <button 
      className={styles.newRouteButton}
      onClick={() => onEdit(null)}
    >
      Create New Route
    </button>
  </div>
);