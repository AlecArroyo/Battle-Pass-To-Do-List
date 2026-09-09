import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // 👈 1. Importas esto

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 2. Lo agregas aquí
  ],
});