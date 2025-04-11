<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Edit Animal Card</title>

    @vite('resources/css/app.css')
</head>

<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="w-full max-w-xl p-4 bg-white shadow-lg rounded-2xl">
        <form class="w-full max-w-lg" enctype="multipart/form-data" action="{{ route('animal.update', $animal->id) }}" method="POST">
            @csrf
            @method('PUT')
            <div class="flex flex-wrap -mx-3 mb-6">
                <!-- Left Column -->
                <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="animal-name">
                        Nama
                    </label>
                    <input
                        class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="animal-name" type="text" placeholder="Card name" value="{{ $animal->nama }}" name="nama" required>
                </div>

                <!-- Right Column -->
                <div class="w-full md:w-1/2 px-3">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        for="animal-rarity">
                        Rarity
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="animal-rarity" name="rarity">
                            <option value="common" {{ $animal->rarity === 'common' ? 'selected' : '' }}>Common</option>
                            <option value="bronze" {{ $animal->rarity === 'bronze' ? 'selected' : '' }}>Bronze</option>
                            <option value="silver" {{ $animal->rarity === 'silver' ? 'selected' : '' }}>Silver</option>
                            <option value="gold {{ $animal->rarity === 'gold' ? 'selected' : '' }}">Gold</option>
                            <option value="ultra" {{ $animal->rarity === 'ultra' ? 'selected' : '' }}>Ultra</option>
                            <option value="kaiser" {{ $animal->rarity === 'kaiser' ? 'selected' : '' }}>Kaiser</option>
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap -mx-3 mb-6">
                <!-- Left Column -->
                <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="gold-attack">
                        Gold Attack
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="gold-attack" name="gold_attack">
                            <option value="G" {{ $animal->gold_attack === 'G' ? 'selected' : '' }}>Guts</option>
                            <option value="T" {{ $animal->gold_attack === 'T' ? 'selected' : '' }}>Tech</option>
                            <option value="P" {{ $animal->gold_attack === 'P' ? 'selected' : '' }}>Power</option>
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="w-full md:w-1/2 px-3">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="animal-type">
                        Type
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="animal-type" name="type">
                            <option value="speed" {{ $animal->type === 'speed' ? 'selected' : '' }}>Speed</option>
                            <option value="multi" {{ $animal->type === 'multi' ? 'selected' : '' }}>Multi</option>
                            <option value="heavy" {{ $animal->type === 'heavy' ? 'selected' : '' }}>Heavy</option>
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap -mx-3 mb-6">
                <!-- Left Column -->
                <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="animal-code">
                        Code
                    </label>
                    <input
                        class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="animal-code" type="text" placeholder="Barcode" value="{{ $animal->card_code }}" name="card_code" required>
                </div>

                <!-- Right Column -->
                <div class="w-full md:w-1/2 px-3">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        for="animal-image">
                        Image
                    </label>
                    <input
                        class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="animal-image" type="file" accept="image/*" value="{{ $animal->image }}" name="image">
                </div>
            </div>

            <div class="mt-6 flex justify-between">
                <a href="{{ route('animal.index') }}" class="cancelBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </a>
                <button type="submit" class="saveBtn">
                    Save
                </button>
            </div>
        </form>
    </div>
</body>

</html>
