<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Miracle extends Model
{
    protected $fillable = [
        'nama',
        'rarity',
        'effect',
        'type',
        'card_code',
        'image'
    ];

    public function scopeFilter($query) {
        if (request('search')) {
            return $query->where('nama', 'LIKE', '%' . request('search') . '%');
        }
    }
}
