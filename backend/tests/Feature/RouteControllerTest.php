<?php

namespace Tests\Feature;

use App\Models\Route;
use App\Models\User;
use App\Models\Waypoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RouteControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_only_see_their_own_private_and_others_public_routes()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Private route by other user
        Route::factory()->create([
            'user_id' => $otherUser->id,
            'is_private' => true,
            'name' => 'Private Other',
        ]);

        // Public route by other user
        Route::factory()->create([
            'user_id' => $otherUser->id,
            'is_private' => false,
            'name' => 'Public Other',
        ]);

        // Own private route
        Route::factory()->create([
            'user_id' => $user->id,
            'is_private' => true,
            'name' => 'My Private',
        ]);

        $this->actingAs($user)
            ->getJson('/api/routes')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['name' => 'Public Other'])
            ->assertJsonFragment(['name' => 'My Private'])
            ->assertJsonMissing(['name' => 'Private Other']);
    }

    public function test_user_can_create_route()
    {
        $user = User::factory()->create();

        $payload = [
            'name' => 'New Route',
            'is_private' => true,
            'waypoints' => [
                ['lat' => 14.5995, 'lng' => 120.9842],
                ['lat' => 14.6000, 'lng' => 120.9850],
            ]
        ];

        $this->actingAs($user)
            ->postJson('/api/routes', $payload)
            ->assertCreated()
            ->assertJsonFragment(['name' => 'New Route']);

        $this->assertDatabaseHas('routes', [
            'name' => 'New Route',
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseCount('waypoints', 2);
    }

    public function test_user_cannot_update_others_route()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $route = Route::factory()->create([
            'user_id' => $otherUser->id,
            'name' => 'Original Name',
        ]);

        $this->actingAs($user)
            ->putJson("/api/routes/{$route->id}", [
                'name' => 'Hacked Name',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('routes', [
            'id' => $route->id,
            'name' => 'Original Name',
        ]);
    }

    public function test_user_can_update_own_route()
    {
        $user = User::factory()->create();

        $route = Route::factory()->create([
            'user_id' => $user->id,
            'name' => 'Old Name',
        ]);

        $this->actingAs($user)
            ->putJson("/api/routes/{$route->id}", [
                'name' => 'Updated Name',
            ])
            ->assertOk()
            ->assertJsonFragment(['name' => 'Updated Name']);
    }

    public function test_user_cannot_delete_others_route()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $route = Route::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($user)
            ->deleteJson("/api/routes/{$route->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('routes', ['id' => $route->id]);
    }

    public function test_user_can_delete_own_route()
    {
        $user = User::factory()->create();

        $route = Route::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->deleteJson("/api/routes/{$route->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('routes', ['id' => $route->id]);
    }
}
