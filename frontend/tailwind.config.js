/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta base; el motor de temas (Fase 3) sobreescribirá esto
        // dinámicamente vía JSON de configuración (Cyberpunk / Retro
        // Terminal / Classic Elegant).
      },
    },
  },
  plugins: [],
}
