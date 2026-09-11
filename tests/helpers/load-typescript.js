import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Execute the production TypeScript with isolated browser APIs and module mocks.
export function loadTypeScript(file, { globals = {}, mocks = {} } = {}) {
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    const source = readFileSync(path, 'utf8').replaceAll('import.meta.env', '({})');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      fileName: path,
    });
    runInNewContext(
      outputText,
      {
        module,
        exports: module.exports,
        console,
        URL,
        URLSearchParams,
        AbortSignal,
        fetch,
        ...globals,
        require: (specifier) => {
          if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
          if (!specifier.startsWith('.')) return require(specifier);
          const base = resolve(dirname(path), specifier);
          const target = [base + '.ts', base + '.tsx', resolve(base, 'index.ts')].find(existsSync);
          if (!target) throw new Error(`Cannot resolve ${specifier} from ${path}`);
          return load(target);
        },
      },
      { filename: path },
    );
    return module.exports;
  }
  return load(resolve(root, file));
}

export const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

export const flush = () => new Promise((resolve) => setImmediate(resolve));

export const event = () => {
  const listeners = new Set();
  return {
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
    emit: (...args) => [...listeners].map((listener) => listener(...args)),
  };
};
