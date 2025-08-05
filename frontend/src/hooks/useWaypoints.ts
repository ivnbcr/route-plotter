import { useState } from 'react';
import type { Waypoint, LatLng } from '../types';

interface WaypointsAPI {
  waypoints: Waypoint[];
  addWaypoint: (point: LatLng) => void;
  removeWaypoint: (id: number) => void;
  updateWaypoint: (id: number, updates: Partial<Waypoint>) => void;
  clearWaypoints: () => void;
  undo: () => void;
  redo: () => void;
  resetWaypoints: (waypoints: Waypoint[]) => void;
  canUndo: boolean;
  canRedo: boolean;
  history: {
    past: Waypoint[][];
    future: Waypoint[][];
  };
}

/**
 * Custom hook for managing waypoints with undo/redo functionality
 * @param initial - Initial array of waypoints
 * @returns Object containing waypoints and manipulation methods
 */
export const useWaypoints = (initial: Waypoint[] = []): WaypointsAPI => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(initial);
  const [history, setHistory] = useState({
    past: [] as Waypoint[][],
    future: [] as Waypoint[][]
  });

  /**
   * Adds a new waypoint to the collection
   * @param point - Latitude/longitude coordinates
   */
  const addWaypoint = (point: LatLng) => {
    const newWaypoint: Waypoint = {
      ...point,
      id: Date.now(),
      order: waypoints.length
    };
    updateWaypoints([...waypoints, newWaypoint]);
  };

  /**
   * Removes a waypoint by ID
   * @param id - ID of waypoint to remove
   */
  const removeWaypoint = (id: number) => {
    updateWaypoints(waypoints.filter(wp => wp.id !== id));
  };

  /**
   * Updates specific waypoint properties
   * @param id - ID of waypoint to update
   * @param updates - Partial waypoint object with new values
   */
  const updateWaypoint = (id: number, updates: Partial<Waypoint>) => {
    updateWaypoints(
      waypoints.map(wp => 
        wp.id === id ? { ...wp, ...updates } : wp
      )
    );
  };

  /** Clears all waypoints */
  const clearWaypoints = () => {
    updateWaypoints([]);
  };

  /** Resets waypoints with new array (for loading routes) */
  const resetWaypoints = (newWaypoints: Waypoint[]) => {
    setWaypoints(newWaypoints);
    setHistory({ past: [], future: [] });
  };

  /** Undo last waypoint change */
  const undo = () => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        future: [waypoints, ...prev.future]
      };
    });
    setWaypoints(history.past[history.past.length - 1] || []);
  };

  /** Redo last undone change */
  const redo = () => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      return {
        past: [...prev.past, waypoints],
        future: prev.future.slice(1)
      };
    });
    setWaypoints(history.future[0] || []);
  };

  /** Internal: Updates waypoints and maintains history */
  const updateWaypoints = (newWaypoints: Waypoint[]) => {
    setHistory(prev => ({
      past: [...prev.past, waypoints],
      future: []
    }));
    setWaypoints(newWaypoints);
  };

  return {
    waypoints,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    clearWaypoints,
    resetWaypoints,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    history
  };
};