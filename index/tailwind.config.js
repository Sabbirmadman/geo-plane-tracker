/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#2a9d8f",
                secondary: "#e9c46a",
                tertiary: "#f4a261",
                quaternary: "#e76f51",
                quinary: "#264653",
                senary: "#e63946",
                septenary: "#a8dadc",
                octonary: "#457b9d",
                nonary: "#1d3557",
                white: "#ffffff",
                black: "#000000",
                gray: "#cccccc",
                lightGray: "#f5f5f5",
                darkGray: "#333333",
                transparent: "transparent",
                lightTransparent: "rgba(0, 0, 0, 0.1)",
                darkTransparent: "rgba(0, 0, 0, 0.5)",
            },
            backgroundImage: {
                heroPattern: "url('/img/heroBg.svg')",
            },
        },
    },
    plugins: [],
};
