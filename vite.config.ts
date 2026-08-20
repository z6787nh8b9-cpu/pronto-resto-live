import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  VitePWA({
    registerType: "prompt",
    manifest: {
      id: "/",
      name: "PRONTO B2B",
      short_name: "PRONTO",
      description: "Pilotage sécurisé de votre vitrine et catalogue professionnel.",
      lang: "fr-FR",
      categories: ["business", "productivity"],
      theme_color: "#5d321f",
      background_color: "#fbf8f3",
      display: "standalone",
      display_override: ["standalone", "minimal-ui"],
      start_url: "/",
      scope: "/",
      icons: [{ src: "/manus-storage/pronto-b2b-app-icon_a2cd4ea0.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" }],
    },
    workbox: {
      navigateFallback: "/index.html",
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
      runtimeCaching: [],
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "wouter"],
          "data-vendor": ["@tanstack/react-query", "@trpc/client", "@trpc/react-query", "superjson"],
          "ui-vendor": ["lucide-react", "sonner"],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
