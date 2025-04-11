<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Strong extends Model
{
    protected $fillable = [
        'nama',
        'rarity',
        'guts_level',
        'tech_level',
        'power_level',
        'aura',
        'card_code',
        'image'
    ];

    public function scopeFilter($query) {
        if (request('search')) {
            return $query->where('nama', 'LIKE', '%' . request('search') . '%');
        }
    }
}
