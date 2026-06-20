import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-1024.png"],
      manifest: {
        name: "Bankroll Lab",
        short_name: "Bankroll Lab",
        description: "Controle privado de banca, risco e disciplina estatística.",
        theme_color: "#07121d",
        background_color: "#07121d",
        display: "standalone",
        orientation: "portrait-primary",
        lang: "pt-BR",
        start_url: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html"
      }
    })
  ],
  resolve: { alias: { "@": decodeURIComponent(new URL("./src", import.meta.url).pathname) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          data: ["dexie", "dexie-react-hooks"],
          ui: ["vaul", "sonner", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-toggle-group"]
        }
      }
    }
  },
  server: { host: "127.0.0.1", port: 4173 }
});
