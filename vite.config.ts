import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      manifest: {
        name: "eYe Pod System",
        short_name: "eYe",
        description: "Jackie · 24-pod compression intelligence system",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/placeholder.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // The PC ships whole under public/pc-os/ — its own build, its own
        // hashed assets, ~29 MB including a 21.6 MB on-device AI wasm. It must
        // stay out of Jackie's precache manifest entirely:
        //   - the wasm alone exceeds any sane per-file limit and fails the
        //     build outright (not a warning — vite-plugin-pwa throws);
        //   - precaching the rest would put ~8 MB of another application into
        //     Jackie's install cost for users who never open /pc.
        // The runtimeCaching CacheFirst rule below still caches PC assets
        // after first use, which is the behaviour docs/PC_EMBED.md describes.
        globIgnores: ["**/node_modules/**/*", "pc-os/**"],
        navigateFallback: "/index.html",
        // Without /pc-os here, a navigation to the embed gets served Jackie's
        // SPA shell instead of the PC, and the iframe renders Jackie inside
        // Jackie.
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /^\/functions/, /^\/pc-os/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "eye-html", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gif|ico)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "eye-assets",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
