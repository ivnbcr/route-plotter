<?php

namespace App\Policies;

use App\Models\Route;
use App\Models\User;

class RoutePolicy
{
    /**
     * Determine whether the user can view any routes.
     */
    public function viewAny(User $user): bool
    {
        // Allow authenticated users to view routes list (or adjust as needed)
        return true;
    }

    /**
     * Determine whether the user can view the route.
     */
    public function view(User $user, Route $route): bool
    {
        return $route->user_id === $user->id || !$route->is_private;
    }

    /**
     * Determine whether the user can create routes.
     */
    public function create(User $user): bool
    {
        // Allow all authenticated users to create routes
        return true;
    }

    /**
     * Determine whether the user can update the route.
     */
    public function update(User $user, Route $route): bool
    {
        return $route->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the route.
     */
    public function delete(User $user, Route $route): bool
    {
        return $route->user_id === $user->id;
    }

    /**
     * (Optional) Determine whether the user can restore the route.
     */
    public function restore(User $user, Route $route): bool
    {
        return $route->user_id === $user->id;
    }

    /**
     * (Optional) Determine whether the user can force delete the route.
     */
    public function forceDelete(User $user, Route $route): bool
    {
        return $route->user_id === $user->id;
    }
}
