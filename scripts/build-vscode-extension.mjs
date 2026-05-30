import { rmSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = resolve(rootDir, "extensions/vscode");
const distDir = resolve(extensionDir, "dist");

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

await build({
  entryPoints: [resolve(extensionDir, "src/extension.ts")],
  outfile: resolve(distDir, "extension.js"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: ["node18"],
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info"
});
