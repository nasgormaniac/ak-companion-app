<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Strong;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class StrongController extends Controller
{
    public function index(Request $request) {
        $strongs = Strong::orderBy('created_at', 'desc')->filter()->paginate(6);
        $strongs->appends($request->except('page'));
        return view('strong.strong', compact('strongs', 'request'));
    }

    public function create() {
        return view('strong.addStrong');
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'rarity' => 'required|in:common,bronze,silver,gold',
            'guts_level' => 'required|in:1,2,3,4,5',
            'tech_level' => 'required|in:1,2,3,4,5',
            'power_level' => 'required|in:1,2,3,4,5',
            'aura' => 'required|in:none,shining,defense,burning,evil,forest,miracle',
            'card_code' => 'required|string|size:8',
            'image' => 'required|image|mimes:jpg,jpeg,png|max:1024'
        ]);

        $imgPath = null;
        if ($request->hasFile('image')) {
            $imgPath = $request->file('image')->store('card_img', 'public');
            $validated['image'] = $imgPath;
        }

        Strong::create($validated);
        return redirect()->route('strong.index');
    }

    public function edit(Strong $strong) {
        return view('strong.editStrong', compact('strong'));
    }

    public function update(Request $request, Strong $strong) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'rarity' => 'required|in:common,bronze,silver,gold',
            'guts_level' => 'required|in:1,2,3,4,5',
            'tech_level' => 'required|in:1,2,3,4,5',
            'power_level' => 'required|in:1,2,3,4,5',
            'aura' => 'required|in:none,shining,defense,burning,evil,forest,miracle',
            'card_code' => 'required|string|size:8',
        ]);

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpg,jpeg,png|max:1024'
            ]);
            $validated['image'] = $request->file('image')->store('card_img', 'public');
            if ($strong->image) {
                Storage::disk('public')->delete($strong->image);
            }
        }

        $strong->update($validated);
        return redirect()->route('strong.index');
    }

    public function destroy(Strong $strong) {
        if ($strong->image) {
            Storage::disk('public')->delete($strong->image);
        }
        $strong->delete();

        return redirect()->route('strong.index');
    }

    public function useCard(Strong $strong) {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'text/plain'
            ])->withBody($strong->card_code, 'text/plain')->post('http://127.0.0.1:9876/sys147/barcode');

            return redirect()->route('miracle.index')->with('message', "Kartu Strong berhasil digunakan. Sekarang pilih kartu Miracle.");
        } catch (\Exception $e) {
            return back()->with('error', "Gagal mengirim kartu. " . $e->getMessage());
        }
    }
}
