import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './utils/ProtectedRoute';
import App from './App';
import { RouteList } from './components/RouteList/RouteList';
import { RouteEditor } from './components/RouteEditor/RouteEditor';
import Login from './components/auth/Login';
import './index.css';
import Register from './components/auth/Register';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <RouteList routes={[]} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'routes/new',
        element: (
          <ProtectedRoute>
            <RouteEditor mode="create" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'routes/:id',
        element: (
          <ProtectedRoute>
            <RouteEditor mode="edit" />
          </ProtectedRoute>
        ),
      },{
        path: 'routes/:id/view',
        element: (
          <ProtectedRoute>
            <RouteEditor mode="view" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'register',
        element: <Register />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);