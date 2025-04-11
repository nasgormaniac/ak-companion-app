<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Animal Kaiser Companion</title>

    @vite('resources/css/app.css')
</head>

<body class="bodyMain">
    <div class="contHome">

        <!-- Bagian Kiri -->
        <form action="/send" method="POST" class="formUtama">
            @csrf
            <input type="text" name="code" placeholder="Card Code" class="inputCode" />
            <button type="submit" class="submitBtn">
                Scan
            </button>
        </form>

        <!-- Bagian Kanan -->
        <div class="menuBtn flex flex-col gap-4 w-full max-w-sm mx-auto my-8">
            <a href="{{ route('animal.index') }}" class="animalBtn">
                Animal
            </a>
            <a href="/strong" class="strongBtn">
                Strong
            </a>
            <a href="/miracle" class="miracleBtn">
                Miracle
            </a>
        </div>

    </div>
</body>

</html>
