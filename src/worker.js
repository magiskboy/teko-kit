const { workerData, parentPort } = require('worker_threads');
const ts = require('typescript');

const { input, outDir, rootDir } = workerData;

const program = ts.createProgram(input, {
  declaration: true,
  declarationMap: true,
  emitDeclarationOnly: true,
  skipLibCheck: true,
  jsx: ts.JsxEmit.React,
  esModuleInterop: true,
  rootDir,
  outDir,
  sourceMap: false,
});

program.emit();
parentPort.postMessage('done');
