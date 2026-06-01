import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(resolve(rootDir, "package.json"), "utf8")
);
const packageDir = resolve(rootDir, "extensions/macos");
const artifactsDir = resolve(rootDir, "artifacts");
const binaryPath = resolve(
  packageDir,
  ".build/release/PromptBridgeMenuBar"
);
const appName = "PromptBridgeArabicMenuBar.app";
const appDir = resolve(artifactsDir, appName);
const macosDir = resolve(appDir, "Contents/MacOS");
const resourcesDir = resolve(appDir, "Contents/Resources");
const appBinaryPath = resolve(macosDir, "PromptBridgeArabicMenuBar");
const converterPath = resolve(resourcesDir, "promptbridge-convert.mjs");
const zipPath = resolve(
  artifactsDir,
  `PromptBridgeArabicMenuBar-v${packageJson.version}-macos.zip`
);

run("swift", ["build", "-c", "release", "--package-path", packageDir]);

await rm(appDir, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(macosDir, { recursive: true });
await mkdir(resourcesDir, { recursive: true });
await cp(binaryPath, appBinaryPath);
await buildBundledConverter();
await writeFile(resolve(appDir, "Contents/Info.plist"), infoPlist(), "utf8");

run("chmod", ["755", appBinaryPath]);
codesignApp();
run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appDir, zipPath]);

console.log(`Created ${zipPath}`);

async function buildBundledConverter() {
  await esbuild.build({
    entryPoints: [resolve(rootDir, "extensions/macos/src/convertPromptForMenuBar.ts")],
    outfile: converterPath,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    sourcemap: false
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: options.optional ? "pipe" : "inherit"
  });

  if (result.status !== 0 && !options.optional) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }

  if (result.status !== 0 && options.optional) {
    console.warn(
      `Skipping optional step: ${command} ${args.join(" ")}\n${result.stderr ?? ""}`
    );
  }
}

function codesignApp() {
  const identity =
    process.env.PROMPTBRIDGE_CODESIGN_IDENTITY ?? findAppleDevelopmentIdentity();

  run("codesign", ["--force", "--deep", "--sign", identity ?? "-", appDir], {
    optional: true
  });
}

function findAppleDevelopmentIdentity() {
  const result = spawnSync(
    "security",
    ["find-identity", "-v", "-p", "codesigning"],
    {
      cwd: rootDir,
      encoding: "utf8",
      stdio: "pipe"
    }
  );

  if (result.status !== 0) {
    return undefined;
  }

  const identityMatch = result.stdout.match(/"([^"]*Apple Development:[^"]+)"/);
  return identityMatch?.[1];
}

function infoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>PromptBridgeArabicMenuBar</string>
  <key>CFBundleIdentifier</key>
  <string>dev.ziadeldesoky.promptbridge-arabic.menubar</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>PromptBridge Arabic Menu Bar</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${packageJson.version}</string>
  <key>CFBundleVersion</key>
  <string>${packageJson.version}</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSSupportsAutomaticTermination</key>
  <false/>
  <key>NSSupportsSuddenTermination</key>
  <false/>
  <key>NSAppleEventsUsageDescription</key>
  <string>PromptBridge sends local copy and paste events only to replace selected Arabic prompts.</string>
</dict>
</plist>
`;
}
