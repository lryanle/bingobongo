/** @type {import("tailwindcss").Config} */
module.exports = {
  // Tailwind v4 uses CSS-based configuration via @theme in globals.css
  // This file is kept for compatibility with tailwindcss-animate plugin
  // Most configuration has been moved to app/globals.css using @theme directive
  plugins: [require("tailwindcss-animate")],
}