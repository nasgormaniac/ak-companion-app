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
                // bronzeOnly: '#da7942',
                // silverOnly: '#a5b7c5',
                goldOnly: '#EFBF04',
            },
            backgroundImage: {
                ultra: 'linear-gradient(to right, #badef8, #64bff6, #0ea0d9)',
                // kaiser: 'linear-gradient(135deg, #a5b7c5 50%, #EFBF04 50%)',
                kaiser: 'linear-gradient(90deg, #f7df82 0%, #EFBF04 30%, #a5b7c5 70%, #d2dbe3 100%)',
                bronze: 'linear-gradient(to right, #f4c5a8, #e79a70, #da7942)',
                silver: 'linear-gradient(to right, #d2dbe3, #bcc9d4, #a5b7c5)',
                gold: 'linear-gradient(to right, #f7df82, #f3cf43, #EFBF04)',
            }
            // #66b5e0 --> color for gradient with kaiser(ultra color)
        },
    },
    plugins: [],
};
