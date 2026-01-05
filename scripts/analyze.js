#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve('datasets');
const OUT_DIR = path.join(DATA_DIR, 'summary');
fs.mkdirSync(OUT_DIR, { recursive: true });

function listFiles(prefix) {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.jsonl'))
    .map((f) => path.join(DATA_DIR, f));
}

function readJsonlFiles(files) {
  const out = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8').trim();
    if (!txt) continue;
    for (const line of txt.split('\n')) if (line) out.push(JSON.parse(line));
  }
  return out;
}

function groupBy(arr, keyFn) {
  return arr.reduce((m, x) => {
    const k = keyFn(x);
    (m[k] ||= []).push(x);
    return m;
  }, {});
}

function writeCSV(filepath, rows, header) {
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map((h) => r[h] ?? '').join(','));
  }
  fs.writeFileSync(filepath, lines.join('\n'));
  console.log('→', filepath);
}

const runFiles = listFiles('runs-');
const mutFiles = listFiles('mutations-');
if (runFiles.length === 0) {
  console.error('No runs-*.jsonl in datasets/');
  process.exit(1);
}
const runs = readJsonlFiles(runFiles);
const muts = mutFiles.length ? readJsonlFiles(mutFiles) : [];

//
// 0) Prepare helpers
//
// Match runs to mutations by runId, strategy, and test title
const keyAttempt = (r) => `${r.runId}|${r.strategy}|${r.title}`;

// If category missing on the run row, try to infer from first mutation of that attempt
const catByAttempt = new Map();
for (const m of muts) {
  const k = `${m.runId}|${m.strategy}|${m.testTitle}`;
  if (!catByAttempt.has(k) && m.category) catByAttempt.set(k, m.category);
}
const runsEnriched = runs.map((r) => {
  if (!r.category) {
    const k = `${r.runId}|${r.strategy}|${r.title}`;
    const cat = catByAttempt.get(k);
    return cat ? { ...r, category: cat } : r;
  }
  return r;
});

// Filter mutated + exclude INFRA for failure metrics
const mutated = runsEnriched.filter((r) => r.phase === 'mutated' && r.failureType !== 'INFRA');

//
// 1) Overall Failure Rate per strategy
//
const byStrat = groupBy(mutated, (r) => r.strategy);
const overallRows = Object.entries(byStrat).map(([strategy, arr]) => {
  const total = arr.length;
  const failed = arr.filter((r) => r.status !== 'passed').length;
  const rate = total ? failed / total : 0;
  return { strategy, total, failed, failRatePct: (rate * 100).toFixed(1) };
});
writeCSV(path.join(OUT_DIR, 'overall_failure_rate.csv'), overallRows, [
  'strategy',
  'total',
  'failed',
  'failRatePct',
]);

//
// 2) Failure Rate by Category per strategy
//
const withCat = mutated.map((r) => ({ ...r, category: r.category || 'unknown' }));
const byStratCat = groupBy(withCat, (r) => `${r.strategy}|${r.category}`);
const byCatRows = Object.entries(byStratCat).map(([key, arr]) => {
  const [strategy, category] = key.split('|');
  const total = arr.length;
  const failed = arr.filter((r) => r.status !== 'passed').length;
  const rate = total ? failed / total : 0;
  return { strategy, category, total, failed, failRatePct: (rate * 100).toFixed(1) };
});
writeCSV(path.join(OUT_DIR, 'failure_rate_by_category.csv'), byCatRows, [
  'strategy',
  'category',
  'total',
  'failed',
  'failRatePct',
]);

//
// 3) Failure Type Distribution per strategy (mutated fails only, excl INFRA)
//
const fails = mutated.filter((r) => r.status !== 'passed' && r.failureType);
const byStratFail = groupBy(fails, (r) => r.strategy);
const distRows = [];
for (const [strategy, arr] of Object.entries(byStratFail)) {
  const totalFails = arr.length;
  const byType = groupBy(arr, (r) => r.failureType);
  const row = { strategy, totalFails };
  for (const [ftype, xs] of Object.entries(byType)) {
    row[`pct_${ftype}`] = ((xs.length / totalFails) * 100).toFixed(1);
  }
  distRows.push(row);
}
const allTypes = Array.from(new Set(fails.map((r) => r.failureType)));
writeCSV(path.join(OUT_DIR, 'failure_type_distribution.csv'), distRows, [
  'strategy',
  'totalFails',
  ...allTypes.map((t) => `pct_${t}`),
]);

//
// 4) (Optional) Baseline flakiness per strategy
//    Group by (strategy, title) and compute 1 - passes/attempts for phase=baseline
//
const baseline = runsEnriched.filter((r) => r.phase === 'baseline');
const byScenario = groupBy(baseline, (r) => `${r.strategy}|${r.title}`);
const flakRows = [];
for (const [k, arr] of Object.entries(byScenario)) {
  const [strategy] = k.split('|');
  const attempts = arr.length;
  const passes = arr.filter((r) => r.status === 'passed').length;
  const flak = attempts ? 1 - passes / attempts : 0;
  flakRows.push({ strategy, attempts, passes, flakinessPct: (flak * 100).toFixed(1) });
}
// summarize per strategy (mean across scenarios)
const byStratFlak = groupBy(flakRows, (r) => r.strategy);
const flakAgg = Object.entries(byStratFlak).map(([strategy, arr]) => {
  const mean = arr.length
    ? arr.reduce((s, x) => s + parseFloat(x.flakinessPct), 0) / arr.length
    : 0;
  return { strategy, scenarios: arr.length, meanFlakinessPct: mean.toFixed(1) };
});
writeCSV(path.join(OUT_DIR, 'baseline_flakiness_by_strategy.csv'), flakAgg, [
  'strategy',
  'scenarios',
  'meanFlakinessPct',
]);

console.log('\nDone. CSVs in:', OUT_DIR);
