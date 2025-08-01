/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./{components,pages,context,services,src}/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }