import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Adjust if using a different framework (e.g., Vue)
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(), // Include your existing plugins here
    tailwindcss(),
  ],
});