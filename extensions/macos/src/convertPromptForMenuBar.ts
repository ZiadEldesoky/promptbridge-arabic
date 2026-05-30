import { isPromptMode, type PromptMode } from "../../../src/translator/modes.js";
import { translatePrompt } from "../../../src/translator/translatePrompt.js";

interface ConverterOptions {
  mode?: PromptMode;
  redact?: boolean;
}

const { options, input } = parseArgs(process.argv.slice(2));

if (!input.trim()) {
  console.error("No prompt text was provided.");
  process.exitCode = 1;
} else {
  const result = translatePrompt(input, options);
  console.log(result.output);
}

function parseArgs(args: string[]): { options: ConverterOptions; input: string } {
  const options: ConverterOptions = {};
  const promptParts: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--redact") {
      options.redact = true;
      continue;
    }

    if (arg === "--mode") {
      const value = args[index + 1];

      if (value && isPromptMode(value)) {
        options.mode = value;
        index += 1;
      }

      continue;
    }

    promptParts.push(arg);
  }

  return {
    options,
    input: promptParts.join(" ")
  };
}
