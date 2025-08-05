<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Route extends Model
{
    use HasFactory;
    use SoftDeletes;
    
    protected $fillable = [
        'user_id',
        'name',
        'is_private',
        'total_distance'
    ];
    
    protected $casts = [
        'is_private' => 'boolean',
        'total_distance' => 'float'
    ];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function waypoints(): HasMany
    {
        return $this->hasMany(Waypoint::class)->orderBy('order');
    }
}