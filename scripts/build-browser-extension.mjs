import { rmSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = resolve(rootDir, "extensions/browser");
const distDir = resolve(extensionDir, "dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

await build({
  entryPoints: {
    background: resolve(extensionDir, "src/background.ts"),
    content: resolve(extensionDir, "src/content.ts"),
    popup: resolve(extensionDir, "src/popup.ts")
  },
  outdir: distDir,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome114", "firefox115"],
  sourcemap: true,
  entryNames: "[name]",
  logLevel: "info"
});
