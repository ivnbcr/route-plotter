<?php

namespace App\Providers;

use App\Models\Route;
use App\Policies\RoutePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Route::class => RoutePolicy::class,
        // Add other model-policy mappings here as needed
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies(); // This is crucial for policies to work
        
        //
    }
}