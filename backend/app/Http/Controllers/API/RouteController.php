<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RouteController extends Controller
{
    public function index(Request $request)
    {
        $primarySort = $request->query('sort_key', 'created_at');
        $primaryOrder = $request->query('sort_order', 'asc');
        $secondarySort = $request->query('secondary_sort_key');
        $secondaryOrder = $request->query('secondary_sort_order', 'asc');

        $query = Route::with('waypoints')
            ->where(function ($query) {
                $query->where('user_id', Auth::id())
                    ->orWhere('is_private', false);
            })
            ->orderBy($primarySort, $primaryOrder);

        if ($secondarySort) {
            $query->orderBy($secondarySort, $secondaryOrder);
        }

        return $query->get()
            ->filter(fn($route) => Auth::user()->can('view', $route))
            ->values();
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_private' => 'boolean',
            'waypoints' => 'required|array|min:2',
            'waypoints.*.lat' => 'required|numeric|between:-90,90',
            'waypoints.*.lng' => 'required|numeric|between:-180,180',
            'total_distance' => 'nullable|numeric'
        ]);
        
        $route = Route::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'is_private' => $validated['is_private'] ?? true,
            'total_distance' => $validated['total_distance'] ?? null
        ]);
        
        foreach ($validated['waypoints'] as $index => $waypoint) {
            $route->waypoints()->create([
                'lat' => $waypoint['lat'],
                'lng' => $waypoint['lng'],
                'order' => $index
            ]);
        }
        
        return response()->json($route->load('waypoints'), 201);
    }
    
    public function show(Route $route)
    {
        $this->authorize('view', $route);
        return $route->load('waypoints');
    }
    
    public function update(Request $request, Route $route)
    {
        $this->authorize('update', $route);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_private' => 'sometimes|boolean',
            'waypoints' => 'sometimes|array|min:2',
            'waypoints.*.lat' => 'required_with:waypoints|numeric|between:-90,90',
            'waypoints.*.lng' => 'required_with:waypoints|numeric|between:-180,180',
            'total_distance' => 'sometimes|numeric'
        ]);
        
        $route->update($validated);
        
        if (isset($validated['waypoints'])) {
            $route->waypoints()->delete();
            foreach ($validated['waypoints'] as $index => $waypoint) {
                $route->waypoints()->create([
                    'lat' => $waypoint['lat'],
                    'lng' => $waypoint['lng'],
                    'order' => $index
                ]);
            }
        }
        
        return $route->load('waypoints');
    }
    
    public function destroy(Route $route)
    {
        $this->authorize('delete', $route);
        $route->delete();
        return response()->noContent();
    }
}