import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  optimizeDeps: {
    exclude: ['pg', 'drizzle-orm/pg-core']
  },
  ssr: {
    noExternal: []
  },
  define: {
    global: 'globalThis',
  }
});
