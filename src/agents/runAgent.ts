import { spawn } from "node:child_process";
import { containsArabic } from "../clipboard/watchClipboard.js";
import type { TranslatePromptOptions } from "../translator/translatePrompt.js";
import { translatePrompt } from "../translator/translatePrompt.js";

export interface PrepareAgentArgsOptions {
  translateOptions?: TranslatePromptOptions;
}

export interface PreparedAgentArgs {
  command: string;
  args: string[];
  convertedArgs: number;
}

export interface RunAgentOptions extends PrepareAgentArgsOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function prepareAgentArgs(
  argv: string[],
  options: PrepareAgentArgsOptions = {}
): PreparedAgentArgs {
  const [command, ...args] = argv;

  if (!command) {
    throw new Error("Missing agent command.");
  }

  let convertedArgs = 0;
  const preparedArgs = args.map((arg) => {
    if (!containsArabic(arg)) {
      return arg;
    }

    convertedArgs += 1;
    return translatePrompt(arg, options.translateOptions).output;
  });

  return {
    command,
    args: preparedArgs,
    convertedArgs
  };
}

export async function runAgentCommand(
  argv: string[],
  options: RunAgentOptions = {}
): Promise<number> {
  const prepared = prepareAgentArgs(argv, options);

  return new Promise((resolve, reject) => {
    const child = spawn(prepared.command, prepared.args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}
