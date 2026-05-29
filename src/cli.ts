#!/usr/bin/env node

import { Command, Option } from "commander";
import { copyToClipboard } from "./clipboard/copyToClipboard.js";
import { loadConfig } from "./config/loadConfig.js";
import { promptModes, type PromptMode } from "./translator/modes.js";
import { translatePrompt } from "./translator/translatePrompt.js";

interface CliOptions {
  mode?: PromptMode;
  config?: string;
  copy?: boolean;
  bilingual?: boolean;
  redact?: boolean;
}

const program = new Command();

program
  .name("promptbridge")
  .description(
    "Convert Arabic or Egyptian Arabic developer prompts into structured English prompts for AI coding agents."
  )
  .version("0.2.0")
  .argument("[prompt...]", "Arabic or Egyptian Arabic coding prompt")
  .option("--config <path>", "Path to a PromptBridge JSON config file")
  .addOption(
    new Option("-m, --mode <mode>", "Prompt mode").choices([...promptModes])
  )
  .option("--copy", "Copy the generated prompt to the clipboard")
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
  )
  .action(async (promptParts: string[], options: CliOptions) => {
    const input = promptParts.join(" ").trim();

    if (!input) {
      program.error("Please provide an Arabic or Egyptian Arabic prompt.");
    }

    const loadedConfig = await loadConfig({ configPath: options.config });
    const config = loadedConfig.config;
    const result = translatePrompt(input, {
      mode: options.mode ?? config.defaultMode,
      bilingual:
        options.bilingual ?? (config.defaultOutput === "bilingual" || undefined),
      redact: options.redact ?? config.redactSecrets,
      glossary: loadedConfig.glossaryEntries
    });

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
