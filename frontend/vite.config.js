import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://back.quizhub.uz",
        changeOrigin: true,
        secure: true,
      },
      "/ws": {
        target: "wss://back.quizhub.uz",
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
