import { render, screen, fireEvent } from '@testing-library/react';
import { RouteEditor } from './RouteEditor';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock the ApiService to avoid real API calls
vi.mock('../../services/api.service', () => ({
  ApiService: {
    getRouteById: vi.fn().mockResolvedValue({ name: 'Test Route', is_private: false, waypoints: [] }),
  },
}));

// Mock the useWaypoints hook
vi.mock('../../hooks/useWaypoints', () => ({
  useWaypoints: () => ({
    waypoints: [],
    addWaypoint: vi.fn(),
    clearWaypoints: vi.fn(),
    resetWaypoints: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
  }),
}));

describe('RouteEditor component', () => {
  it('renders mode-based UI titles correctly', () => {
    const { rerender } = render(
      <MemoryRouter>
        <RouteEditor mode="create" />
      </MemoryRouter>
    );
    expect(screen.getByText('Create Route')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <RouteEditor mode="edit" />
      </MemoryRouter>
    );
    expect(screen.getByText('Edit Route')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <RouteEditor mode="view" />
      </MemoryRouter>
    );
    expect(screen.getByText('View Route')).toBeInTheDocument();
  });

  it('hides inputs and buttons in view mode', () => {
    render(
      <MemoryRouter>
        <RouteEditor mode="view" />
      </MemoryRouter>
    );

    // Route name input should NOT be in the document
    expect(screen.queryByPlaceholderText('Route name')).not.toBeInTheDocument();

    // Privacy toggle input (checkbox) should NOT be in the document
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes.length).toBe(0);

    // Save button should NOT be in the document
    expect(screen.queryByRole('button', { name: /Create|Update/i })).not.toBeInTheDocument();

    // Undo, Redo, Clear buttons should NOT be rendered
    expect(screen.queryByTitle('Undo last action')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Redo last action')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Clear all waypoints')).not.toBeInTheDocument();

    // Search input should NOT be rendered
    expect(screen.queryByPlaceholderText('Search for a location...')).not.toBeInTheDocument();

    // Use Location button should NOT be rendered
    expect(screen.queryByTitle('Use User location')).not.toBeInTheDocument();
  });

  it('shows inputs and buttons in create/edit mode', () => {
    const { rerender } = render(
      <MemoryRouter>
        <RouteEditor mode="create" />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Route name')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <RouteEditor mode="edit" />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Route name')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
  });

  it('does not add waypoint on map click when mode is view', async () => {
  const addWaypointMock = vi.fn();

  vi.doMock('../../hooks/useWaypoints', () => ({
    useWaypoints: () => ({
      waypoints: [],
      addWaypoint: addWaypointMock,
      clearWaypoints: vi.fn(),
      resetWaypoints: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    }),
  }));

  vi.resetModules();

  const { RouteEditor: RouteEditorWithMock } = await import('./RouteEditor');

  render(
    <MemoryRouter>
      <RouteEditorWithMock mode="view" />
    </MemoryRouter>
  );

  // Use findByTestId to wait for the map container to appear
  const mapDiv = await screen.findByTestId('map-container');

  fireEvent.click(mapDiv);

  expect(addWaypointMock).not.toHaveBeenCalled();
});

});
