import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type {
  LoadedPromptBridgeConfig,
  PromptBridgeConfig
} from "./types.js";
import type { GlossaryEntry } from "../translator/glossary.js";
import { isPromptMode } from "../translator/modes.js";

const configFileNames = [".promptbridge.json", "promptbridge.config.json"];

export interface LoadConfigOptions {
  configPath?: string;
  cwd?: string;
  homeDir?: string;
}

export async function loadConfig(
  options: LoadConfigOptions = {}
): Promise<LoadedPromptBridgeConfig> {
  const cwd = options.cwd ?? process.cwd();
  const homeDir = options.homeDir ?? homedir();
  const configPath = resolveConfigPath({ ...options, cwd, homeDir });

  if (!configPath) {
    return { config: {}, glossaryEntries: [] };
  }

  const rawConfig = await readJson(configPath);
  const config = parseConfig(rawConfig, configPath);
  const glossaryEntries = config.glossaryPath
    ? await loadGlossaryEntries(config.glossaryPath, dirname(configPath))
    : [];

  return { config, configPath, glossaryEntries };
}

function resolveConfigPath(
  options: Required<Pick<LoadConfigOptions, "cwd" | "homeDir">> &
    Pick<LoadConfigOptions, "configPath">
): string | undefined {
  if (options.configPath) {
    const explicitPath = resolve(options.cwd, options.configPath);

    if (!existsSync(explicitPath)) {
      throw new Error(`Config file not found: ${explicitPath}`);
    }

    return explicitPath;
  }

  const candidates = [
    ...configFileNames.map((fileName) => join(options.cwd, fileName)),
    join(options.homeDir, ".promptbridge", "config.json")
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

async function readJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read JSON from ${filePath}: ${message}`);
  }
}

function parseConfig(value: unknown, configPath: string): PromptBridgeConfig {
  if (!isPlainObject(value)) {
    throw new Error(`Config file must contain a JSON object: ${configPath}`);
  }

  const config = value as Record<string, unknown>;

  if (
    typeof config.defaultMode === "string" &&
    !isPromptMode(config.defaultMode)
  ) {
    throw new Error(`Invalid defaultMode in ${configPath}: ${config.defaultMode}`);
  }

  if (
    typeof config.defaultOutput === "string" &&
    config.defaultOutput !== "english" &&
    config.defaultOutput !== "bilingual"
  ) {
    throw new Error(
      `Invalid defaultOutput in ${configPath}: ${config.defaultOutput}`
    );
  }

  return {
    defaultMode:
      typeof config.defaultMode === "string" && isPromptMode(config.defaultMode)
        ? config.defaultMode
        : undefined,
    defaultOutput:
      config.defaultOutput === "bilingual" ? "bilingual" : "english",
    preserveArabicUIText:
      typeof config.preserveArabicUIText === "boolean"
        ? config.preserveArabicUIText
        : undefined,
    redactSecrets:
      typeof config.redactSecrets === "boolean"
        ? config.redactSecrets
        : undefined,
    agent: typeof config.agent === "string" ? config.agent : undefined,
    style: config.style === "structured" ? "structured" : undefined,
    glossaryPath:
      typeof config.glossaryPath === "string" ? config.glossaryPath : undefined
  };
}

async function loadGlossaryEntries(
  glossaryPath: string,
  configDir: string
): Promise<GlossaryEntry[]> {
  const resolvedPath = isAbsolute(glossaryPath)
    ? glossaryPath
    : resolve(configDir, glossaryPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Glossary file not found: ${resolvedPath}`);
  }

  const value = await readJson(resolvedPath);
  return parseGlossaryEntries(value, resolvedPath);
}

function parseGlossaryEntries(value: unknown, filePath: string): GlossaryEntry[] {
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      parseGlossaryEntry(entry, `${filePath}[${index}]`)
    );
  }

  if (isPlainObject(value)) {
    return Object.entries(value).map(([arabic, english]) => {
      if (typeof english !== "string") {
        throw new Error(`Glossary value for "${arabic}" must be a string.`);
      }

      return { arabic, english, tags: ["custom"] };
    });
  }

  throw new Error(`Glossary file must contain an array or object: ${filePath}`);
}

function parseGlossaryEntry(value: unknown, label: string): GlossaryEntry {
  if (!isPlainObject(value)) {
    throw new Error(`Glossary entry must be an object: ${label}`);
  }

  const entry = value as Record<string, unknown>;

  if (typeof entry.arabic !== "string" || typeof entry.english !== "string") {
    throw new Error(`Glossary entry needs arabic and english strings: ${label}`);
  }

  return {
    arabic: entry.arabic,
    english: entry.english,
    tags: Array.isArray(entry.tags)
      ? entry.tags.filter((tag): tag is string => typeof tag === "string")
      : ["custom"]
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
