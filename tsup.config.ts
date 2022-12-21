import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ["esm"],
  target: ["node16"],
});