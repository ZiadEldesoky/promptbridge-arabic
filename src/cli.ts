#!/usr/bin/env node

import { Command, Option } from "commander";
import { copyToClipboard } from "./clipboard/copyToClipboard.js";
import {
  convertClipboardOnce,
  watchClipboard
} from "./clipboard/watchClipboard.js";
import { loadConfig } from "./config/loadConfig.js";
import type { LoadedPromptBridgeConfig } from "./config/types.js";
import { promptModes, type PromptMode } from "./translator/modes.js";
import { translatePrompt } from "./translator/translatePrompt.js";

interface CliOptions {
  mode?: PromptMode;
  config?: string;
  copy?: boolean;
  bilingual?: boolean;
  redact?: boolean;
}

interface WatchOptions extends CliOptions {
  interval?: string;
  once?: boolean;
  quiet?: boolean;
}

const program = new Command();

function addPromptOptions(command: Command): Command {
  return command
    .option("--config <path>", "Path to a PromptBridge JSON config file")
    .addOption(
      new Option("-m, --mode <mode>", "Prompt mode").choices([...promptModes])
    )
    .addOption(
      new Option(
        "--bilingual",
        "Include an Arabic summary after the English prompt"
      ).default(undefined)
    )
    .addOption(
      new Option(
        "--redact",
        "Redact common secrets before generating the prompt"
      ).default(undefined)
    );
}

function translateOptionsFromConfig(
  options: CliOptions,
  loadedConfig: LoadedPromptBridgeConfig
) {
  const config = loadedConfig.config;

  return {
    mode: options.mode ?? config.defaultMode,
    bilingual:
      options.bilingual ?? (config.defaultOutput === "bilingual" || undefined),
    redact: options.redact ?? config.redactSecrets,
    glossary: loadedConfig.glossaryEntries
  };
}

program
  .name("promptbridge")
  .description(
    "Convert Arabic or Egyptian Arabic developer prompts into structured English prompts for AI coding agents."
  )
  .version("0.3.0");

addPromptOptions(
  program
    .command("watch")
    .description(
      "Watch the clipboard and automatically replace Arabic prompts with English prompts."
    )
    .option("--once", "Convert the current clipboard once and exit")
    .option("--interval <ms>", "Clipboard polling interval in milliseconds", "750")
    .option("--quiet", "Do not print watch status messages")
).action(async (options: WatchOptions) => {
  const loadedConfig = await loadConfig({ configPath: options.config });
  const translateOptions = translateOptionsFromConfig(options, loadedConfig);
  const intervalMs = Number.parseInt(options.interval ?? "750", 10);

  if (!Number.isFinite(intervalMs)) {
    program.error("--interval must be a number.");
  }

  if (options.once) {
    const event = await convertClipboardOnce({
      translateOptions,
      quiet: options.quiet
    });

    if (!options.quiet) {
      console.error(
        event.converted
          ? "Converted current clipboard text."
          : `Clipboard was not converted: ${event.reason ?? "unknown"}.`
      );
    }

    return;
  }

  await watchClipboard({
    translateOptions,
    intervalMs,
    quiet: options.quiet
  });
});

addPromptOptions(
  program
    .argument("[prompt...]", "Arabic or Egyptian Arabic coding prompt")
    .option("--copy", "Copy the generated prompt to the clipboard")
)
  .action(async (promptParts: string[], options: CliOptions) => {
    const input = promptParts.join(" ").trim();

    if (!input) {
      program.error("Please provide an Arabic or Egyptian Arabic prompt.");
    }

    const loadedConfig = await loadConfig({ configPath: options.config });
    const result = translatePrompt(input, translateOptionsFromConfig(options, loadedConfig));

    console.log(result.output);

    if (options.copy) {
      await copyToClipboard(result.output);
      console.error("Copied prompt to clipboard.");
    }
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`promptbridge: ${message}`);
  process.exitCode = 1;
});
