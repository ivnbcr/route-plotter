<?php

use App\Models\Waypoint;
use App\Models\Route;

return new class extends \Illuminate\Database\Eloquent\Factories\Factory {
    protected $model = Waypoint::class;

    public function definition(): array
    {
        return [
            'route_id' => Route::factory(),
            'lat' => $this->faker->latitude,
            'lng' => $this->faker->longitude,
            'order' => 0,
        ];
    }
};
