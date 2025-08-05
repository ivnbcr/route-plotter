<?php

namespace Database\Factories;

use App\Models\Route;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RouteFactory extends Factory
{
    protected $model = Route::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->sentence(3),
            'is_private' => $this->faker->boolean(50),
            'total_distance' => $this->faker->randomFloat(2, 0.5, 10.0),
        ];
    }
}
