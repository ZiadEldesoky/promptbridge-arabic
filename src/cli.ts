#!/usr/bin/env node

import { Command, Option } from "commander";
import { copyToClipboard } from "./clipboard/copyToClipboard.js";
import {
  convertClipboardOnce,
  watchClipboard
} from "./clipboard/watchClipboard.js";
import { replaceSelectedText } from "./clipboard/replaceSelection.js";
import { loadConfig } from "./config/loadConfig.js";
import type { LoadedPromptBridgeConfig } from "./config/types.js";
import { runAgentCommand } from "./agents/runAgent.js";
import { promptModes, type PromptMode } from "./translator/modes.js";
import { translatePrompt } from "./translator/translatePrompt.js";
import { checkForUpdates } from "./updates/checkForUpdates.js";
import { getPackageVersion } from "./version.js";

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

interface ReplaceSelectionOptions extends CliOptions {
  copyDelay?: string;
  pasteDelay?: string;
  quiet?: boolean;
  restoreClipboard?: boolean;
}

interface RunOptions extends CliOptions {
  verbose?: boolean;
}

interface CheckUpdatesOptions {
  json?: boolean;
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
  .version(getPackageVersion());

program
  .command("check-updates")
  .description("Check GitHub Releases for a newer PromptBridge Arabic version.")
  .option("--json", "Print machine-readable update information")
  .action(async (options: CheckUpdatesOptions) => {
    const result = await checkForUpdates();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`Current version: ${result.currentVersion}`);

    if (result.latestVersion) {
      console.log(`Latest version: ${result.latestVersion}`);
    }

    if (result.error) {
      console.log(`Could not check for updates: ${result.error}`);
      console.log(`Release page: ${result.releaseUrl}`);
      process.exitCode = 1;
      return;
    }

    if (result.updateAvailable) {
      console.log(`Update available: ${result.latestVersion}`);
      console.log(`Download: ${result.releaseUrl}`);
      return;
    }

    console.log("PromptBridge Arabic is up to date.");
    console.log(`Release page: ${result.releaseUrl}`);
  });

addPromptOptions(
  program
    .command("run")
    .description(
      "Run a CLI coding agent and automatically convert Arabic prompt arguments before execution."
    )
    .argument("<agentCommand>", "Agent command to run, such as codex or claude")
    .argument("[agentArgs...]", "Arguments passed to the agent command")
    .option("--verbose", "Print when Arabic arguments are converted")
    .allowUnknownOption(true)
)
  .allowExcessArguments(true)
  .action(
    async (
      agentCommand: string,
      agentArgs: string[],
      options: RunOptions
    ) => {
      const loadedConfig = await loadConfig({ configPath: options.config });
      const translateOptions = translateOptionsFromConfig(options, loadedConfig);
      const exitCode = await runAgentCommand([agentCommand, ...agentArgs], {
        translateOptions
      });

      if (options.verbose) {
        console.error("Agent command finished.");
      }

      process.exitCode = exitCode;
    }
  );

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
    .command("replace-selection")
    .description(
      "Convert selected Arabic text and paste the English prompt back into the active app. Supports macOS, Windows, and Linux with platform input automation."
    )
    .option("--copy-delay <ms>", "Delay after copying selected text", "120")
    .option("--paste-delay <ms>", "Delay before and after pasting output", "120")
    .option("--restore-clipboard", "Restore the previous clipboard after pasting")
    .option("--quiet", "Do not print replacement status messages")
).action(async (options: ReplaceSelectionOptions) => {
  const loadedConfig = await loadConfig({ configPath: options.config });
  const translateOptions = translateOptionsFromConfig(options, loadedConfig);
  const copyDelayMs = Number.parseInt(options.copyDelay ?? "120", 10);
  const pasteDelayMs = Number.parseInt(options.pasteDelay ?? "120", 10);

  if (!Number.isFinite(copyDelayMs) || !Number.isFinite(pasteDelayMs)) {
    program.error("--copy-delay and --paste-delay must be numbers.");
  }

  const event = await replaceSelectedText({
    translateOptions,
    copyDelayMs,
    pasteDelayMs,
    restoreClipboard: options.restoreClipboard
  });

  if (!event.converted && event.reason === "unsupported_platform") {
    program.error(
      "replace-selection currently supports macOS, Windows, and Linux."
    );
  }

  if (!options.quiet) {
    console.error(
      event.converted
        ? "Replaced selected Arabic text with an English prompt."
        : `Selected text was not converted: ${event.reason ?? "unknown"}.`
    );
  }
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
