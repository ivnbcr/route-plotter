import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="app-layout">
      {/* Optional: Add header/navigation here */}
      <Outlet /> {/* This renders the matched child route */}
    </div>
  );
}