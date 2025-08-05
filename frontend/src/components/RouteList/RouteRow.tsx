import React from 'react';
import { Trash2 } from 'lucide-react';
import styles from './RouteRow.module.css';

interface RouteRowProps {
  id: number;
  name: string;
  distance: number;
  createdAt: string;
  isPrivate: boolean;
  isOwner: boolean;
  onDelete: (id: number) => void;
  onClick: (id: number) => void;
}

export const RouteRow: React.FC<RouteRowProps> = ({
  id,
  name,
  distance,
  createdAt,
  isPrivate,
  isOwner,
  onDelete,
  onClick,
}) => {
  return (
    <div className={styles.routeCard} onClick={() => onClick(id)}>
      <div className={styles.routeHeader}>
        <div className={styles.routeHeaderLeft}>
          <h3 className={styles.routeName}>{name}</h3>
          <div className={styles.routeMeta}>
            <span>📏 {distance.toFixed(2)} km</span>
            <span>📅 {createdAt}</span>
          </div>
        </div>

        <div className={styles.routeHeaderRight}>
          <span className={isPrivate ? styles.privateBadge : styles.publicBadge}>
            {isPrivate ? 'Private' : 'Public'}
          </span>
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className={styles.deleteButton}
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
