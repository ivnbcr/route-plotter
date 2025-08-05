<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\API\RouteController;

Route::get('/welcome', function () {
    return response()->json([
        'message' => 'Welcome to the API!',
    ]);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', RegisterController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('routes', RouteController::class);
});