import { defineConfig } from "tsup";

export default defineConfig({
  bundle: true,
  entry: ["src/svelte.ts"],
  format: ["iife"],
  sourcemap: false,
  clean: false,
  minify: true,
});
