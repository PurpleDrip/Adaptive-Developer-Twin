/**
 * Minimal VS Code API stub for unit tests.
 * Only stubs the surface area actually used by the extension modules.
 */

export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: <T>(key: string, defaultValue?: T): T => {
      const defaults: Record<string, unknown> = {
        'gatewayUrl': 'http://localhost:8000',
        'extensionId': '',
      };
      return (defaults[key] ?? defaultValue) as T;
    },
  }),
  workspaceFolders: [{ uri: { fsPath: '/tmp/test-workspace' } }],
  onDidChangeTextDocument: (_handler: unknown) => ({ dispose: () => {} }),
  onDidSaveTextDocument: (_handler: unknown) => ({ dispose: () => {} }),
};

export const window = {
  showWarningMessage: (_msg: string) => Promise.resolve(undefined),
  showErrorMessage: (_msg: string) => Promise.resolve(undefined),
  showInformationMessage: (_msg: string) => Promise.resolve(undefined),
  createStatusBarItem: () => ({
    text: '',
    show: () => {},
    hide: () => {},
    dispose: () => {},
  }),
  activeTextEditor: undefined,
};

export const env = {
  machineId: 'test-machine-id-abc123',
};

export const StatusBarAlignment = { Left: 1, Right: 2 };

export const Uri = {
  file: (p: string) => ({ fsPath: p }),
};

export const extensions = {
  getExtension: (_id: string) => undefined,
};

export const commands = {};

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(public start: Position, public end: Position) {}
}

export class ExtensionContext {
  globalStorageUri = { fsPath: '/tmp/adt-test-storage' };
  secrets = {
    get: async (_key: string): Promise<string | undefined> => 'ADT-TESTID12',
    store: async (_key: string, _value: string): Promise<void> => {},
    delete: async (_key: string): Promise<void> => {},
  };
  globalState = {
    get: <T>(_key: string): T | undefined => undefined,
    update: async (_key: string, _value: unknown): Promise<void> => {},
  };
  subscriptions: { dispose(): void }[] = [];
}
