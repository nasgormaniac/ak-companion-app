<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Miracle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class MiracleController extends Controller
{
    public function index(Request $request) {
        $miracles = Miracle::orderBy('created_at', 'desc')->filter()->paginate(6);
        $miracles->appends($request->except('page'));
        return view('miracle.miracle', compact('miracles', 'request'));
    }

    public function create() {
        return view('miracle.addMiracle');
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'rarity' => 'required|in:common,bronze,silver,gold',
            'effect' => 'required|in:None,Slot Jammer,All Big,All Doubling,All Miracle,Lucky Chance,Lucky Break,All G,All T,All P,Resurrection,G Guard,T Guard,P Guard,Mystery Miracle',
            'type' => 'required|in:speed,multi,heavy',
            'card_code' => 'required|string|size:8',
            'image' => 'required|image|mimes:jpg,jpeg,png|max:1024'
        ]);

        $imgPath = null;
        if ($request->hasFile('image')) {
            $imgPath = $request->file('image')->store('card_img', 'public');
            $validated['image'] = $imgPath;
        }

        Miracle::create($validated);
        return redirect()->route('miracle.index');
    }

    public function edit(Miracle $miracle) {
        return view('miracle.editMiracle', compact('miracle'));
    }

    public function update(Request $request, Miracle $miracle) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'rarity' => 'required|in:common,bronze,silver,gold',
            'effect' => 'required|in:None,Slot Jammer,All Big,All Doubling,All Miracle,Lucky Chance,Lucky Break,All G,All T,All P,Resurrection,G Guard,T Guard,P Guard,Mystery Miracle',
            'type' => 'required|in:speed,multi,heavy',
            'card_code' => 'required|string|size:8',
        ]);

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpg,jpeg,png|max:1024'
            ]);
            $validated['image'] = $request->file('image')->store('card_img', 'public');
            if ($miracle->image) {
                Storage::disk('public')->delete($miracle->image);
            }
        }

        $miracle->update($validated);
        return redirect()->route('miracle.index');
    }

    public function destroy(Miracle $miracle) {
        if ($miracle->image) {
            Storage::disk('public')->delete($miracle->image);
        }
        $miracle->delete();

        return redirect()->route('miracle.index');
    }

    public function useCard(Miracle $miracle) {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'text/plain'
            ])->withBody($miracle->card_code, 'text/plain')->post('http://127.0.0.1:9876/sys147/barcode');

            return redirect()->route('home')->with('message', "Kartu Miracle berhasil digunakan. Selamat bermain!.");
        } catch (\Exception $e) {
            return back()->with('error', "Gagal mengirim kartu. " . $e->getMessage());
        }
    }
}
