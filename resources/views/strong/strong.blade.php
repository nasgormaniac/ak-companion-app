<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Strong Card Catalogue</title>

    @vite('resources/css/app.css')
</head>

<body>

    <div class="catalogue">
        <!-- Header Navigation -->
        <div class="headerNav">
            <!-- Kiri: Home -->
            <a href="{{ route('home') }}" class="homeBtn">
                &larr; Home
            </a>

            <!-- Kanan: Add -->
            <a href="{{ route('strong.add') }}" class="addStrongBtn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    class="size-5 inline-block mr-1 mb-1">
                    <path
                        d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>Add
            </a>
        </div>

        <!-- Search -->
        <div class="searchGroup">
            <form action="{{ route('strong.index') }}" method="GET" class="flex w-full items-center gap-x-2">
                <input type="text" id="searchInput" placeholder="Search..." name="search"
                    value="{{ $request->get('search') }}" class="searchInput" />
                <button type="submit" id="searchBtn" class="searchBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path fill-rule="evenodd"
                            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </form>
        </div>

        <!-- Card Grid -->
        <div class="cardList">
            @foreach ($strongs as $strong)
                @php
                    $rarityClass = match ($strong->rarity) {
                        'common' => 'bg-strong',
                        'bronze' => 'bg-bronze',
                        'silver' => 'bg-silver',
                        'gold' => 'bg-gold',
                        default => 'bg-green-500',
                    };
                @endphp

                <div class="catalogueCard">
                    <img src="{{ asset('storage/' . $strong->image) }}" alt="{{ $strong->nama }}" class="w-full">

                    <div class="p-3">
                        <div class="flex justify-between">
                            <h2 class="namaKartu">{!! Str::limit($strong->nama, 15, '...') !!}</h2>
                            <span class="rarity {{ $rarityClass }}">{{ ucfirst($strong->rarity) }}</span>
                        </div>

                        <div class="info">
                            <div class="flex items-center space-x-2">
                                <span class="type">{{ ucfirst($strong->aura) }}</span>
                            </div>

                            <span class="barcode">{{ $strong->card_code }}</span>
                        </div>

                        <div class="actBtnGroup">
                            <!-- Tombol kiri -->
                            <div class="flex space-x-2">
                                <form action="{{ route('strong.destroy', $strong->id) }}" method="POST"
                                    onsubmit="return confirm('Are you sure?')">
                                    @csrf
                                    @method('DELETE')
                                    <button class="delBtn">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                            class="size-5">
                                            <path fill-rule="evenodd"
                                                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </form>
                                <a href="{{ route('strong.edit', $strong->id) }}">
                                    <button class="editBtn">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                            class="size-5">
                                            <path
                                                d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
                                        </svg>
                                    </button>
                                </a>
                            </div>

                            <!-- Tombol kanan -->
                            <form action="{{ route('strong.use', $strong->id) }}" method="POST">
                                @csrf
                                <button class="useBtn">Use</button>
                            </form>
                        </div>

                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <div class="flex justify-center mt-4">
        {{ $strongs->onEachSide(2)->links() }}
    </div>

</body>

</html>
