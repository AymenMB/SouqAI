/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#7f0df2",
                "background-light": "#f7f5f8",
                "background-dark": "#191022",
                "card-white": "#FFFFFF",
                "pure-white": "#FFFFFF",
                "light-grey": "#F5F7FA",
                "dark-grey": "#1A202C",
                "medium-grey": "#718096",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "2xl": "20px",
            },
            boxShadow: {
                'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
            }
        },
    },
    plugins: [],
}
