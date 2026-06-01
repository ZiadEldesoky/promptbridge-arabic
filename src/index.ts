export type { PromptMode } from "./translator/modes.js";
export type {
  TranslatePromptOptions,
  TranslatePromptResult
} from "./translator/translatePrompt.js";
export { translatePrompt } from "./translator/translatePrompt.js";
export { loadConfig } from "./config/loadConfig.js";
export type {
  LoadedPromptBridgeConfig,
  PromptBridgeConfig,
  PromptBridgeOutput
} from "./config/types.js";
export {
  containsArabic,
  convertClipboardOnce,
  convertClipboardText,
  watchClipboard
} from "./clipboard/watchClipboard.js";
export { replaceSelectedText } from "./clipboard/replaceSelection.js";
export type {
  ClipboardConversionEvent,
  WatchClipboardOptions
} from "./clipboard/watchClipboard.js";
export type { ReplaceSelectedTextOptions } from "./clipboard/replaceSelection.js";
export {
  prepareAgentArgs,
  runAgentCommand
} from "./agents/runAgent.js";
export type {
  PreparedAgentArgs,
  PrepareAgentArgsOptions,
  RunAgentOptions
} from "./agents/runAgent.js";
export {
  preserveTechnicalTokens,
  restoreTechnicalTokens
} from "./translator/preserveTechnicalTokens.js";
export { redactSecrets } from "./redaction/redactSecrets.js";
export {
  checkForUpdates,
  compareVersions,
  latestReleaseApiUrl,
  normalizeVersion,
  releasesPageUrl
} from "./updates/checkForUpdates.js";
export type { UpdateCheckResult } from "./updates/checkForUpdates.js";
