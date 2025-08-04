import { Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      {user && (
        <header className="app-header"> {/* Use the CSS class */}
          <span className="app-title">Route Planner</span>
          
          {user.name && (
            <span className="user-greeting">Hello, {user.name}!</span>
          )}
          
          <button 
            onClick={logout}
            className="logout-btn" 
          >
            Logout
          </button>
        </header>
      )}
      <Outlet />
    </div>
  );
}