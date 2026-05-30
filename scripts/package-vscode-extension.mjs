import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { delimiter, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = resolve(rootDir, "extensions/vscode");
const artifactDir = resolve(rootDir, "artifacts");
const packageJson = JSON.parse(
  await readFile(resolve(rootDir, "package.json"), "utf8")
);
const vsixPath = resolve(
  artifactDir,
  `promptbridge-arabic-vscode-v${packageJson.version}.vsix`
);

if (!existsSync(resolve(extensionDir, "dist/extension.js"))) {
  throw new Error("Missing VS Code extension build. Run npm run build:vscode.");
}

mkdirSync(artifactDir, { recursive: true });
rmSync(vsixPath, { force: true });

const result = spawnSync(
  "vsce",
  ["package", "--no-dependencies", "--out", vsixPath],
  {
    cwd: extensionDir,
    env: {
      ...process.env,
      PATH: `${resolve(rootDir, "node_modules/.bin")}${delimiter}${
        process.env.PATH ?? ""
      }`
    },
    encoding: "utf8",
    stdio: "inherit"
  }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error("Failed to create VSIX package.");
}

console.log(`Created ${vsixPath}`);
