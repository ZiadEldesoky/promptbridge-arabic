import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

export function getPackageVersion(): string {
  return packageJson.version;
}
