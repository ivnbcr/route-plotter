import { type FC } from 'react';
import styles from './SortControls.module.css';

export type SortKey = 'total_distance' | 'created_at' | ''; // '' means "None"
export type SortOrder = 'asc' | 'desc';

interface SortControlsProps {
  primarySort: SortKey;
  primaryOrder: SortOrder;
  secondarySort: SortKey;
  secondaryOrder: SortOrder;
  onPrimarySortChange: (value: SortKey) => void;
  onPrimaryOrderChange: (value: SortOrder) => void;
  onSecondarySortChange: (value: SortKey) => void;
  onSecondaryOrderChange: (value: SortOrder) => void;
}

export const SortControls: FC<SortControlsProps> = ({
  primarySort,
  primaryOrder,
  secondarySort,
  secondaryOrder,
  onPrimarySortChange,
  onPrimaryOrderChange,
  onSecondarySortChange,
  onSecondaryOrderChange,
}) => {
  const allOptions: SortKey[] = ['', 'total_distance', 'created_at'];

  const primaryOptions = allOptions.filter((opt) => opt !== secondarySort);
  const secondaryOptions = allOptions.filter((opt) => opt !== primarySort);

  return (
    <section className={styles.sortControls}>
      <h4>Sort Options</h4>
      <div className={styles.sortRow}>
        <label>
          Primary Sort:
          <select
            value={primarySort}
            onChange={(e) => onPrimarySortChange(e.target.value as SortKey)}
          >
            {primaryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '' ? 'None' : opt === 'total_distance' ? 'Distance' : 'Created Date'}
              </option>
            ))}
          </select>
          <select
            value={primaryOrder}
            onChange={(e) => onPrimaryOrderChange(e.target.value as SortOrder)}
            disabled={primarySort === ''}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </label>

        <label>
          Secondary Sort:
          <select
            value={secondarySort}
            onChange={(e) => onSecondarySortChange(e.target.value as SortKey)}
          >
            {secondaryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '' ? 'None' : opt === 'total_distance' ? 'Distance' : 'Created Date'}
              </option>
            ))}
          </select>
          <select
            value={secondaryOrder}
            onChange={(e) => onSecondaryOrderChange(e.target.value as SortOrder)}
            disabled={secondarySort === ''}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </label>
      </div>
    </section>
  );
};
