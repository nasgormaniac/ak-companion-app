<?php

use App\Http\Controllers\AnimalController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\MiracleController;
use App\Http\Controllers\StrongController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CardController::class, 'home'])->name('home');
Route::post('/send', [CardController::class, 'send']);

Route::controller(AnimalController::class)->group(function() {
    Route::get('/animal', 'index')->name('animal.index');
    Route::get('/animal/add', 'create')->name('animal.add');
    Route::post('/animal/store', 'store')->name('animal.store');
    Route::get('/animal/edit/{animal}', 'edit')->name('animal.edit');
    Route::put('/animal/edit/{animal}', 'update')->name('animal.update');
    Route::delete('/animal/del/{animal}', 'destroy')->name('animal.destroy');
    Route::post('/animal/use/{animal}', 'useCard')->name('animal.use');
});

Route::controller(StrongController::class)->group(function() {
    Route::get('/strong', 'index')->name('strong.index');
    Route::get('/strong/add', 'create')->name('strong.add');
    Route::post('/strong/store', 'store')->name('strong.store');
    Route::get('/strong/edit/{strong}', 'edit')->name('strong.edit');
    Route::put('/strong/edit/{strong}', 'update')->name('strong.update');
    Route::delete('/strong/del/{strong}', 'destroy')->name('strong.destroy');
    Route::post('/strong/use/{strong}', 'useCard')->name('strong.use');
});

Route::controller(MiracleController::class)->group(function() {
    Route::get('/miracle', 'index')->name('miracle.index');
    Route::get('/miracle/add', 'create')->name('miracle.add');
    Route::post('/miracle/store', 'store')->name('miracle.store');
    Route::get('/miracle/edit/{miracle}', 'edit')->name('miracle.edit');
    Route::put('/miracle/edit/{miracle}', 'update')->name('miracle.update');
    Route::delete('/miracle/del/{miracle}', 'destroy')->name('miracle.destroy');
    Route::post('/miracle/use/{miracle}', 'useCard')->name('miracle.use');
});
