<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Edit Strong Card</title>

    @vite('resources/css/app.css')
</head>

<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="w-full max-w-xl p-4 bg-white shadow rounded-2xl">
        <form class="w-full max-w-lg" enctype="multipart/form-data" action="{{ route('strong.update', $strong->id) }}" method="POST" autocomplete="off">
            @csrf
            @method('PUT')
            <div class="flex flex-wrap -mx-3 mb-6">
                <!-- Left Column -->
                <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="animal-name">
                        Name
                    </label>
                    <input
                        class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="animal-name" type="text" name="nama" value="{{ $strong->nama }}" placeholder="Card name" required>
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
                            id="animal-rarity" name="rarity" required>
                            <option value="common" {{ $strong->rarity === 'common' ? 'selected' : '' }}>Common</option>
                            <option value="bronze" {{ $strong->rarity === 'bronze' ? 'selected' : '' }}>Bronze</option>
                            <option value="silver" {{ $strong->rarity === 'silver' ? 'selected' : '' }}>Silver</option>
                            <option value="gold" {{ $strong->rarity === 'gold' ? 'selected' : '' }}>Gold</option>
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
                <!-- Center Row with 4 Dropdowns -->
                <div class="w-full md:w-1/5 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="guts">
                        Guts
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="guts" name="guts_level" required>
                            <option value="1" {{ $strong->guts_level === '1' ? 'selected' : '' }}>1</option>
                            <option value="2" {{ $strong->guts_level === '2' ? 'selected' : '' }}>2</option>
                            <option value="3" {{ $strong->guts_level === '3' ? 'selected' : '' }}>3</option>
                            <option value="4" {{ $strong->guts_level === '4' ? 'selected' : '' }}>4</option>
                            <option value="5" {{ $strong->guts_level === '5' ? 'selected' : '' }}>5</option>
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="w-full md:w-1/5 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="tech">
                        Tech
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="tech" name="tech_level" required>
                            <option value="1" {{ $strong->tech_level === '1' ? 'selected' : '' }}>1</option>
                            <option value="2" {{ $strong->tech_level === '2' ? 'selected' : '' }}>2</option>
                            <option value="3" {{ $strong->tech_level === '3' ? 'selected' : '' }}>3</option>
                            <option value="4" {{ $strong->tech_level === '4' ? 'selected' : '' }}>4</option>
                            <option value="5" {{ $strong->tech_level === '5' ? 'selected' : '' }}>5</option>
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="w-full md:w-1/5 px-3 mb-6 md:mb-0">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="power">
                        Power
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="power" name="power_level" required>
                            <option value="1" {{ $strong->power_level === '1' ? 'selected' : '' }}>1</option>
                            <option value="2" {{ $strong->power_level === '2' ? 'selected' : '' }}>2</option>
                            <option value="3" {{ $strong->power_level === '3' ? 'selected' : '' }}>3</option>
                            <option value="4" {{ $strong->power_level === '4' ? 'selected' : '' }}>4</option>
                            <option value="5" {{ $strong->power_level === '5' ? 'selected' : '' }}>5</option>
                        </select>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="w-full md:w-2/5 px-3">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="aura">
                        Aura
                    </label>
                    <div class="relative">
                        <select
                            class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            id="aura" name="aura" required>
                            <option value="none" {{ $strong->aura === 'none' ? 'selected' : '' }}>None</option>
                            <option value="shining" {{ $strong->aura === 'shining' ? 'selected' : '' }}>Shining</option>
                            <option value="defense" {{ $strong->aura === 'defense' ? 'selected' : '' }}>Defense</option>
                            <option value="burning" {{ $strong->aura === 'burning' ? 'selected' : '' }}>Burning</option>
                            <option value="evil" {{ $strong->aura === 'evil' ? 'selected' : '' }}>Evil</option>
                            <option value="forest" {{ $strong->aura === 'forest' ? 'selected' : '' }}>Forest</option>
                            <option value="miracle" {{ $strong->aura === 'miracle' ? 'selected' : '' }}>Miracle</option>
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
                        id="animal-code" type="text" name="card_code" value="{{ $strong->card_code }}" placeholder="Barcode" required>
                </div>

                <!-- Right Column -->
                <div class="w-full md:w-1/2 px-3">
                    <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        for="animal-image">
                        Image
                    </label>
                    <input
                        class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="animal-image" type="file" accept="image/*" name="image" value="{{ $strong->image }}">
                </div>
            </div>

            <div class="mt-6 flex justify-between">
                <a href="{{ route('strong.index') }}" class="cancelBtn">
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
