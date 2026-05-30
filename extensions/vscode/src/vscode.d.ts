declare module "vscode" {
  export interface Thenable<T> extends PromiseLike<T> {}

  export interface Disposable {
    dispose(): unknown;
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
  }

  export interface TextEditor {
    document: TextDocument;
    selections: Selection[];
    edit(
      callback: (editBuilder: TextEditorEdit) => void
    ): Thenable<boolean>;
  }

  export interface TextDocument {
    getText(range?: Range): string;
  }

  export interface TextEditorEdit {
    replace(location: Range | Selection, value: string): void;
  }

  export interface Range {}

  export interface Selection extends Range {}

  export interface WorkspaceConfiguration {
    get<T>(section: string, defaultValue: T): T;
  }

  export namespace commands {
    export function registerCommand(
      command: string,
      callback: (...args: unknown[]) => unknown
    ): Disposable;
  }

  export namespace env {
    export const clipboard: {
      writeText(value: string): Thenable<void>;
    };
  }

  export namespace window {
    export const activeTextEditor: TextEditor | undefined;
    export function showInputBox(options?: {
      prompt?: string;
      placeHolder?: string;
      ignoreFocusOut?: boolean;
    }): Thenable<string | undefined>;
    export function showInformationMessage(message: string): Thenable<string | undefined>;
    export function showWarningMessage(message: string): Thenable<string | undefined>;
  }

  export namespace workspace {
    export function getConfiguration(section?: string): WorkspaceConfiguration;
  }
}
