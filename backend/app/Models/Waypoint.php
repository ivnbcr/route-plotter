<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Waypoint extends Model
{
    protected $fillable = [
        'route_id',
        'lat',
        'lng',
        'order'
    ];
    
    protected $casts = [
        'lat' => 'float',
        'lng' => 'float'
    ];
    
    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }
}
