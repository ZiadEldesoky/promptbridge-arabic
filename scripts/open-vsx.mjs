import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { delimiter, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(resolve(rootDir, "package.json"), "utf8")
);
const vscodePackageJson = JSON.parse(
  await readFile(resolve(rootDir, "extensions/vscode/package.json"), "utf8")
);
const artifactPath = resolve(
  rootDir,
  "artifacts",
  `promptbridge-arabic-vscode-v${packageJson.version}.vsix`
);
const token = process.env.OVSX_PAT ?? process.env.OPEN_VSX_TOKEN;
const command = process.argv[2];

if (!command || !["verify", "ensure-namespace", "publish"].includes(command)) {
  fail(
    "Usage: node scripts/open-vsx.mjs <verify|ensure-namespace|publish>"
  );
}

if (!token) {
  fail("Missing OVSX_PAT or OPEN_VSX_TOKEN environment variable.");
}

if (vscodePackageJson.publisher !== "ziadeldesoky") {
  fail(
    `Unexpected VS Code publisher '${vscodePackageJson.publisher}'. Expected 'ziadeldesoky'.`
  );
}

if (command === "verify") {
  runOvsx(["verify-pat", vscodePackageJson.publisher]);
}

if (command === "ensure-namespace") {
  const result = runOvsx(
    ["create-namespace", vscodePackageJson.publisher],
    false
  );

  if (result.status !== 0) {
    console.warn(
      "Open VSX namespace creation did not complete. It may already exist; publishing will verify ownership."
    );
  }
}

if (command === "publish") {
  if (!existsSync(artifactPath)) {
    fail(`Missing VSIX artifact: ${artifactPath}`);
  }

  runOvsx(["publish", artifactPath, "--skip-duplicate"]);
}

function runOvsx(args, failOnError = true) {
  const localBinDir = resolve(rootDir, "node_modules/.bin");
  const ovsxCommand = process.platform === "win32" ? "ovsx.cmd" : "ovsx";
  const result = spawnSync(ovsxCommand, ["--pat", token, ...args], {
    cwd: rootDir,
    env: {
      ...process.env,
      PATH: `${localBinDir}${delimiter}${process.env.PATH ?? ""}`
    },
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (failOnError && result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
