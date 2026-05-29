/**
 * Global test setup: registers a vscode stub in Node's module cache
 * so that `require('vscode')` in any source file resolves to our mock.
 * Must be required via --require before any test files are loaded.
 */
const path = require('path');
const Module = require('module');

// Point 'vscode' → our compiled mock-vscode (ts-node will compile it on first require)
const mockPath = path.resolve(__dirname, 'fixtures', 'mock-vscode.ts');

// Override the module resolver so 'vscode' resolves to our mock file
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parentModule, isMain, options) {
  if (request === 'vscode') {
    return mockPath;
  }
  return originalResolve.call(this, request, parentModule, isMain, options);
};
