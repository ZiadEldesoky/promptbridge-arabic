import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = resolve(rootDir, "extensions/browser");
const artifactDir = resolve(rootDir, "artifacts");
const packageJson = JSON.parse(
  await readFile(resolve(rootDir, "package.json"), "utf8")
);
const archiveName = `promptbridge-arabic-browser-extension-v${packageJson.version}.zip`;
const archivePath = resolve(artifactDir, archiveName);
const requiredFiles = [
  "manifest.json",
  "popup.html",
  "README.md",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "dist/background.js",
  "dist/content.js",
  "dist/popup.js"
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(extensionDir, file))) {
    throw new Error(
      `Missing ${file}. Run npm run build:browser before packaging the extension.`
    );
  }
}

mkdirSync(artifactDir, { recursive: true });
rmSync(archivePath, { force: true });

const result = spawnSync(
  "zip",
  [
    "-qr",
    archivePath,
    "manifest.json",
    "popup.html",
    "README.md",
    "icons",
    "dist"
  ],
  {
    cwd: extensionDir,
    encoding: "utf8"
  }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(result.stderr || "Failed to create browser extension zip.");
}

console.log(`Created ${archivePath}`);
