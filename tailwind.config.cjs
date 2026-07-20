/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        arabic: ['"Amiri"', "serif"],
      },
    },
  },
  plugins: [],
};
