import * as assert from 'assert';
import * as vscode from 'vscode';
import Mocha from 'mocha';
import * as globModule from 'glob';
import * as path from 'path';

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', timeout: 30000, color: true });
  const testsRoot = path.resolve(__dirname);
  const files = globModule.sync('**/*.test.js', { cwd: testsRoot });
  files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise<void>((resolve, reject) => {
    try {
      mocha.run(failures => {
        if (failures > 0) reject(new Error(`${failures} tests failed`));
        else resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

suite('ADT Extension E2E', () => {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension('PurpleDrip.adt-extension');
    assert.ok(ext, 'Extension not found — check publisher and name in package.json');
    if (!ext.isActive) await ext.activate();
  });

  test('Extension activates without error', () => {
    const ext = vscode.extensions.getExtension('PurpleDrip.adt-extension');
    assert.ok(ext?.isActive, 'Extension should be active after activation');
  });

  test('ADT register command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('adt.register'), 'adt.register command not found');
  });

  test('ADT status command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('adt.status'), 'adt.status command not found');
  });

  test('Extension configuration schema is accessible', () => {
    const config = vscode.workspace.getConfiguration('adt');
    const gatewayUrl = config.get<string>('gatewayUrl');
    assert.ok(typeof gatewayUrl === 'string', 'gatewayUrl config should be a string');
    assert.ok(gatewayUrl.startsWith('http'), 'default gatewayUrl should be HTTP URL');
  });
});
