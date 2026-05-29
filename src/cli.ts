#!/usr/bin/env node

import { Command, Option } from "commander";
import { copyToClipboard } from "./clipboard/copyToClipboard.js";
import { promptModes, type PromptMode } from "./translator/modes.js";
import { translatePrompt } from "./translator/translatePrompt.js";

interface CliOptions {
  mode?: PromptMode;
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
  .version("0.1.0")
  .argument("[prompt...]", "Arabic or Egyptian Arabic coding prompt")
  .addOption(
    new Option("-m, --mode <mode>", "Prompt mode").choices([...promptModes])
  )
  .option("--copy", "Copy the generated prompt to the clipboard")
  .option("--bilingual", "Include an Arabic summary after the English prompt")
  .option("--redact", "Redact common secrets before generating the prompt")
  .action(async (promptParts: string[], options: CliOptions) => {
    const input = promptParts.join(" ").trim();

    if (!input) {
      program.error("Please provide an Arabic or Egyptian Arabic prompt.");
    }

    const result = translatePrompt(input, {
      mode: options.mode,
      bilingual: options.bilingual,
      redact: options.redact
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
