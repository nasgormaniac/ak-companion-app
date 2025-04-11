<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AnimalController extends Controller
{
    public function index(Request $request) {
        $animals = Animal::orderBy('created_at', 'desc')->filter()->paginate(6);
        $animals->appends($request->except('page'));
        return view('animal.animal', compact('animals', 'request'));
    }

    public function create() {
        return view('animal.addAnimal');
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'rarity' => 'required|in:common,bronze,silver,gold,ultra,kaiser',
            'gold_attack' => 'required|in:G,T,P',
            'type' => 'required|in:speed,multi,heavy',
            'card_code' => 'required|string|size:8',
            'image' => 'required|image|mimes:jpg,jpeg,png|max:1024'
        ]);

        $imgPath = null;
        if ($request->hasFile('image')) {
            $imgPath = $request->file('image')->store('card_img', 'public');
            $validated['image'] = $imgPath;
        }

        Animal::create($validated);
        return redirect()->route('animal.index');
    }

    public function edit(Animal $animal) {
        return view('animal.editAnimal', compact('animal'));
    }

    public function update(Request $request, Animal $animal) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'rarity' => 'required|in:common,bronze,silver,gold,ultra,kaiser',
            'gold_attack' => 'required|in:G,T,P',
            'type' => 'required|in:speed,multi,heavy',
            'card_code' => 'required|string|size:8',
        ]);

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpg,jpeg,png|max:1024'
            ]);
            $validated['image'] = $request->file('image')->store('card_img', 'public');
            if ($animal->image) {
                Storage::disk('public')->delete($animal->image);
            }
        }

        $animal->update($validated);
        return redirect()->route('animal.index');
    }

    public function destroy(Animal $animal) {
        if ($animal->image) {
            Storage::disk('public')->delete($animal->image);
        }
        $animal->delete();

        return redirect()->route('animal.index')->with('success', 'Animal Deleted!');
    }

    public function useCard(Animal $animal) {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'text/plain'
            ])->withBody($animal->card_code, 'text/plain')->post('http://127.0.0.1:9876/sys147/barcode');

            return redirect()->route('strong.index')->with('message', "Kartu Animal berhasil digunakan. Sekarang pilih kartu Strong.");
        } catch (\Exception $e) {
            return back()->with('error', "Gagal mengirim kartu. " . $e->getMessage());
        }
    }
}
