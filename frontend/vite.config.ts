import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const defaultBase = command === "serve" ? "/" : "/vibe-genealogy/";
  const base = env.VITE_BASE_PATH ?? defaultBase;

  return {
    base,
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      port: 5173,
    },
  };
});
