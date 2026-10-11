import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createInstrumenter } from 'istanbul-lib-instrument';
import coverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

const map = coverage.createCoverageMap({});
map.merge(JSON.parse(await readFile('coverage/backend/coverage-final.json', 'utf8')));
const browserFiles = (await readdir('coverage/browser')).filter((name) => name.endsWith('.json'));
if (!browserFiles.length)
  throw Error('Browser coverage is missing; refusing a backend-only result.');
for (const name of browserFiles)
  map.merge(JSON.parse(await readFile(`coverage/browser/${name}`, 'utf8')));

async function sources(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sources(path)));
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

// Include every application JS/JSX file, even a route never visited by a test.
for (const file of await sources('src/frontend/src')) {
  const path = file.replaceAll('\\', '/');
  if (map.files().some((key) => resolve(key) === file)) continue;
  const instrumenter = createInstrumenter({ esModules: true, parserPlugins: ['jsx'] });
  instrumenter.instrumentSync(await readFile(file, 'utf8'), path);
  map.addFileCoverage(instrumenter.lastFileCoverage());
}
const expected = [...(await sources('src/backend')), ...(await sources('src/frontend/src'))];
const missing = expected.filter((file) => !map.files().some((key) => resolve(key) === file));
if (missing.length) throw Error(`Source files missing from coverage: ${missing.join(', ')}`);

await mkdir('coverage', { recursive: true });
const context = libReport.createContext({ dir: 'coverage', coverageMap: map });
for (const type of ['text', 'html', 'lcovonly', 'json', 'json-summary'])
  reports.create(type).execute(context);

const summary = map.getCoverageSummary().toJSON();
const groups = {};
for (const [name, prefix] of [
  ['backend', 'src/backend/'],
  ['frontend', 'src/frontend/src/'],
]) {
  const group = coverage.createCoverageMap({});
  for (const file of map.files())
    if (relative(process.cwd(), file).replaceAll('\\', '/').startsWith(prefix))
      group.addFileCoverage(map.fileCoverageFor(file));
  groups[name] = { files: group.files().length, ...group.getCoverageSummary().toJSON() };
}
const result = { total: summary, ...groups, threshold: 60, metric: 'lines' };
await writeFile('coverage/result.json', JSON.stringify(result, null, 2) + '\n');
const markdown = [
  '## Application coverage',
  '',
  '| Scope | Lines | Statements | Functions | Branches |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...[['Total', summary], ...Object.entries(groups)].map(
    ([name, item]) =>
      `| ${name} | ${item.lines.pct}% | ${item.statements.pct}% | ${item.functions.pct}% | ${item.branches.pct}% |`,
  ),
  '',
  `All ${expected.length} application JS/JSX files are included, including untested files.`,
  'Required line coverage: 60% overall and independently for frontend/backend.',
  '',
].join('\n');
await writeFile('coverage/summary.md', markdown);
console.log(markdown);
for (const [name, item] of [['total', summary], ...Object.entries(groups)])
  if (item.lines.pct < 60) throw Error(`${name} line coverage ${item.lines.pct}% is below 60%.`);
