import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 1420,
    host: '0.0.0.0',
    strictPort: true,
    // 👇 ESTO EVITA QUE VITE VIGILE LA CARPETA DE COMPILACIÓN DE RUST/TAURI
    watch: {
      ignored: ["**/src-tauri/target/**"]
    }
  },
  optimizeDeps: {
    entries: [
      './index.html',
      './cocina.html',
      './tablet.html'
    ]
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        cocina: './cocina.html',
        tablet: './tablet.html'
      }
    }
  }
});