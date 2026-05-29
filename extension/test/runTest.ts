import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './e2e/extension.test');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // NOTE: '--disable-extensions' intentionally omitted — it would prevent
      // the ADT extension itself from loading during E2E tests.
      // '--no-sandbox' is appended automatically by @vscode/test-electron.
      // On Windows with spaces in the project path (e.g. "C:\VS Code\..."),
      // @vscode/test-electron@2.x passes args via shell:true without quoting,
      // which truncates paths at the first space. Run E2E in CI (Linux/macOS)
      // or from a path without spaces to avoid this limitation.
    });
  } catch (err) {
    console.error('E2E test runner failed:', err);
    process.exit(1);
  }
}

main();
