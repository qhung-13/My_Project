import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Check if the module is from node_modules
          if (id.includes("node_modules")) {
            if (
              id.includes("react/") ||
              id.includes("react-dom/") ||
              id.includes("react-router-dom/")
            ) {
              return "react-vendor";
            }
            if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) {
              return "state-vendor";
            }
            if (
              id.includes("hls.js") ||
              id.includes("plyr") ||
              id.includes("socket.io-client")
            ) {
              return "media-vendor";
            }
            if (id.includes("@stripe")) {
              return "payment-vendor";
            }
          }
        },
      },
    },
  },
});
