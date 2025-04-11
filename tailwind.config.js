import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                mine: ['Nunito', ...defaultTheme.fontFamily.sans]
            },
            colors: {
                animal: '#fe0a0a',
                strong: '#39ce14',
                miracle: '#029aff',
                bronze: '#da7942',
                silver: '#a5b7c5',
                gold: '#EFBF04'
            },
            backgroundImage: {
                ultra: 'linear-gradient(to right, #badef8, #64bff6, #0ea0d9)',
                kaiser: 'linear-gradient(135deg, #a5b7c5 50%, #EFBF04 50%)'
            }
            // #66b5e0 --> color for gradient with kaiser(ultra color)
        },
    },
    plugins: [],
};
