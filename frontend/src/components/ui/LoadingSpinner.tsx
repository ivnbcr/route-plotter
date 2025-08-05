import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  className?: string;
}

export const LoadingSpinner = ({ 
  fullPage = false, 
  className = '' 
}: LoadingSpinnerProps) => {
  return (
    <div className={`${styles.spinnerContainer} ${fullPage ? styles.fullPage : ''} ${className}`}>
      <div className={styles.spinner}></div>
    </div>
  );
};