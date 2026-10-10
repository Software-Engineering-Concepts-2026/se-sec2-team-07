import { createInstrumenter } from 'istanbul-lib-instrument';
import { resolve } from 'node:path';

// Build tooling only; application coverage targets src/frontend/src.
// Added only by test:coverage. Ordinary dev/production builds have no counters.
export function coveragePlugin() {
  const root = resolve('src/frontend/src').replaceAll('\\', '/') + '/';
  const instrumenter = createInstrumenter({
    esModules: true,
    parserPlugins: ['jsx'],
    produceSourceMap: true,
    coverageGlobalScope: 'globalThis',
    coverageGlobalScopeFunc: false,
  });
  return {
    name: 'focus-test-coverage',
    enforce: 'pre',
    transform(code, id) {
      const path = id.replaceAll('\\', '/');
      if (!path.startsWith(root) || !/\.(js|jsx)$/.test(path)) return;
      return {
        code: instrumenter.instrumentSync(code, path),
        map: instrumenter.lastSourceMap(),
      };
    },
  };
}
