const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'datasets');
const SUMMARY_DIR = path.join(DATA_DIR, 'summary');

const RUNS_GLOB_PREFIX = 'runs-';
const MUTATIONS_GLOB_PREFIX = 'mutations-';

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function main() {
  ensureDir(SUMMARY_DIR);

  const runs = readJsonlFiles(findFiles(DATA_DIR, RUNS_GLOB_PREFIX));
  const muts = readJsonlFiles(findFiles(DATA_DIR, MUTATIONS_GLOB_PREFIX));

  const errorSummaryPath = path.join(DATA_DIR, 'error_summary.json');
  if (fs.existsSync(errorSummaryPath)) {
    copyToSummary(errorSummaryPath);
  }

  runs.forEach((r) => {
    r.phase = r.phase || 'baseline';
    r.strategy = r.strategy || 'unknown';
    r.status = r.status || 'failed';
    r.category = normalizeCategory(r.category);
    r.failureType = r.failureType || null;
    if (typeof r.durationMs !== 'number' && r.durationMs != null) {
      r.durationMs = Number(r.durationMs);
    }
  });

  // --- Baseline flakiness
  const baseline = runs.filter((r) => r.phase === 'baseline' && !isInfra(r));
  writeCsv(path.join(SUMMARY_DIR, 'baseline_flakiness_by_strategy.csv'), rateByStrategy(baseline));

  const mutated = runs.filter((r) => r.phase === 'mutated' && !isInfra(r));

  // Overall failure rate by strategy
  writeCsv(path.join(SUMMARY_DIR, 'overall_failure_rate.csv'), rateByStrategy(mutated));

  // Failure rate by category per strategy
  writeCsv(
    path.join(SUMMARY_DIR, 'failure_rate_by_category.csv'),
    rateByStrategyAndCategory(mutated),
  );

  // Failure rate by scenario × strategy
  writeCsv(
    path.join(SUMMARY_DIR, 'failure_rate_by_scenario.csv'),
    rateByScenarioAndStrategy(mutated),
  );

  // Failure type distribution (counts)
  const ftdCounts = failureTypeCounts(mutated);
  writeCsv(path.join(SUMMARY_DIR, 'failure_type_distribution.csv'), ftdCounts.wide);
  writeCsv(path.join(SUMMARY_DIR, 'failure_type_distribution_tidy.csv'), ftdCounts.tidy);

  // Time to failure (failed mutated runs)
  const ttf = timeToFailure(mutated);
  writeCsv(path.join(SUMMARY_DIR, 'time_to_failure.csv'), ttf.agg);
  writeCsv(path.join(SUMMARY_DIR, 'time_to_failure_raw.csv'), ttf.raw);

  // Robustness score (100 - overall failure rate)
  const overall = rateByStrategy(mutated);
  const robustness = overall.map((row) => ({
    strategy: row.strategy,
    n: row.n,
    failed: row.failed,
    failure_rate_percent: row.failure_rate_percent,
    robustness_score: +(100 - row.failure_rate_percent).toFixed(2),
  }));
  writeCsv(path.join(SUMMARY_DIR, 'robustness_scores.csv'), robustness);

  const jsonSummary = {
    overall_failure_rate: overall,
    failure_rate_by_category: rateByStrategyAndCategory(mutated),
    failure_rate_by_scenario: rateByScenarioAndStrategy(mutated),
    failure_type_distribution: ftdCounts.wide,
    baseline_flakiness: rateByStrategy(baseline),
    robustness_scores: robustness,
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(SUMMARY_DIR, 'strategy_comparison.json'),
    JSON.stringify(jsonSummary, null, 2),
    'utf8',
  );

  console.log(`Summary written to: ${SUMMARY_DIR}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function findFiles(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.jsonl'))
    .map((f) => path.join(dir, f));
}

function readJsonlFiles(files) {
  const out = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const l = line.trim();
      if (!l) continue;
      try {
        out.push(JSON.parse(l));
      } catch (e) {
        // skip malformed lines
      }
    }
  }
  return out;
}

function copyToSummary(filePath) {
  const dest = path.join(SUMMARY_DIR, path.basename(filePath));
  fs.copyFileSync(filePath, dest);
}

function isInfra(r) {
  return r.failureType === 'INFRA';
}
function isFailure(r) {
  // treat TIMEOUT as a failure; exclude INFRA elsewhere
  return r.status !== 'passed';
}
function normalizeCategory(c) {
  if (!c) return null;
  const s = String(c).toLowerCase();
  if (s.startsWith('attr')) return 'attribute';
  if (s.startsWith('cont')) return 'content';
  if (s.startsWith('struct')) return 'structural';
  return s;
}

function groupBy(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}

function rateByStrategy(rows) {
  const g = groupBy(rows, (r) => r.strategy);
  const res = [];
  for (const [strategy, arr] of g) {
    const n = arr.length;
    const failed = arr.filter(isFailure).length;
    const pct = n ? +((failed * 100) / n).toFixed(2) : 0;
    res.push({ strategy, n, failed, failure_rate_percent: pct });
  }
  res.sort((a, b) => a.strategy.localeCompare(b.strategy));
  return res;
}

function rateByStrategyAndCategory(rows) {
  const g = groupBy(rows, (r) => `${r.strategy}|||${r.category || 'unknown'}`);
  const res = [];
  for (const [key, arr] of g) {
    const [strategy, category] = key.split('|||');
    const n = arr.length;
    const failed = arr.filter(isFailure).length;
    const pct = n ? +((failed * 100) / n).toFixed(2) : 0;
    res.push({ strategy, category, n, failed, failure_rate_percent: pct });
  }
  res.sort((a, b) => (a.strategy + a.category).localeCompare(b.strategy + b.category));
  return res;
}

function rateByScenarioAndStrategy(rows) {
  const g = groupBy(rows, (r) => `${r.scenarioId || 'unknown'}|||${r.strategy}`);
  const res = [];
  for (const [key, arr] of g) {
    const [scenario_id, strategy] = key.split('|||');
    const n = arr.length;
    const failed = arr.filter(isFailure).length;
    const pct = n ? +((failed * 100) / n).toFixed(2) : 0;
    res.push({ scenario_id, strategy, n, failed, failure_rate_percent: pct });
  }
  res.sort((a, b) => (a.scenario_id + a.strategy).localeCompare(b.scenario_id + b.strategy));
  return res;
}

function failureTypeCounts(rows) {
  const failed = rows.filter(isFailure);
  const strategies = Array.from(new Set(failed.map((r) => r.strategy)));
  const ftypes = Array.from(new Set(failed.map((r) => r.failureType || 'UNKNOWN')));

  const tidy = [];
  for (const s of strategies) {
    const sub = failed.filter((r) => r.strategy === s);
    const byType = groupBy(sub, (r) => r.failureType || 'UNKNOWN');
    for (const t of ftypes) {
      tidy.push({
        strategy: s,
        failure_type: t,
        count: (byType.get(t) || []).length,
      });
    }
  }

  const wide = [];
  for (const s of strategies) {
    const row = { strategy: s };
    const sub = failed.filter((r) => r.strategy === s);
    const byType = groupBy(sub, (r) => r.failureType || 'UNKNOWN');
    for (const t of ftypes) {
      row[normalizeHead(t)] = (byType.get(t) || []).length;
    }
    wide.push(row);
  }

  return { tidy, wide };
}

function normalizeHead(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function timeToFailure(rows) {
  const failed = rows.filter(isFailure).filter((r) => typeof r.durationMs === 'number');
  const raw = failed.map((r) => ({
    strategy: r.strategy,
    duration_ms: r.durationMs,
  }));
  const g = groupBy(raw, (r) => r.strategy);
  const agg = [];
  for (const [strategy, arr] of g) {
    const xs = arr.map((a) => a.duration_ms).sort((a, b) => a - b);
    const mean = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    const p50 = percentile(xs, 0.5);
    const p90 = percentile(xs, 0.9);
    const p99 = percentile(xs, 0.99);
    agg.push({
      strategy,
      n_failures: xs.length,
      mean_ms: +mean.toFixed(2),
      p50_ms: +p50.toFixed(2),
      p90_ms: +p90.toFixed(2),
      p99_ms: +p99.toFixed(2),
    });
  }
  agg.sort((a, b) => a.strategy.localeCompare(b.strategy));
  return { raw, agg };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

function writeCsv(outPath, rows) {
  if (!rows || !rows.length) {
    fs.writeFileSync(outPath, '', 'utf8');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
