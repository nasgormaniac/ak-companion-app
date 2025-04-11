<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Animal extends Model
{
    protected $fillable = [
        'nama',
        'rarity',
        'gold_attack',
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
