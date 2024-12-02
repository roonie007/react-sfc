import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import reactSFC from "../../src/plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), reactSFC()],
});
