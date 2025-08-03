import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { RouteList } from './components/RouteList/RouteList';
import { RouteEditor } from './components/RouteEditor/RouteEditor';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Your root layout component
    children: [
      {
        index: true,
        element: <RouteList routes={[]} />,
      },
      {
        path: 'routes/new',
        element: <RouteEditor mode="create" />,
      },
      {
        path: 'routes/:id',
        element: <RouteEditor mode="edit" />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} /> {/* Single source of truth */}
  </React.StrictMode>
);