<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Models\Miracle;
use App\Models\Strong;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CardController extends Controller
{
    public function home() {
        return view('index');
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|size:8|regex:/^bn[\w\S]{6}$/',
        ]);

        $cardCode = $validated['code'];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'text/plain'
            ])->withBody($cardCode, 'text/plain')->post('http://127.0.0.1:9876/sys147/barcode');

            if ($response->successful()) {
                return back()->with('message', "Berhasil kirim: {$cardCode} (Status: {$response->status()})");
            } else {
                return back()->with('error', "Gagal kirim: {$cardCode} (Status: {$response->status()})\nBody: " . $response->body());
            }
        } catch (\Exception $e) {
            return back()->with('error', "Error kirim: {$cardCode} | Exception: " . $e->getMessage());
        }
    }
}
