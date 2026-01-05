import type { Reporter, FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import fs = require('fs');
import path = require('path');

export default class BenchmarkReporter implements Reporter {
  private runs!: fs.WriteStream;
  private muts!: fs.WriteStream;
  private runId!: string;
  private mutsPath!: string;
  private mutsCount: number = 0;

  onBegin(_: FullConfig, __: Suite) {
    fs.mkdirSync('datasets', { recursive: true });
    this.runId = new Date().toISOString().replace(/[:.]/g, '-');
    this.runs = fs.createWriteStream(path.join('datasets', `runs-${this.runId}.jsonl`), {
      flags: 'a',
    });
    this.mutsPath = path.join('datasets', `mutations-${this.runId}.jsonl`);
    this.muts = fs.createWriteStream(this.mutsPath, { flags: 'a' });
    this.mutsCount = 0;
  }

  private deriveFailureType(errors: (string | undefined)[], status: string): string | null {
    const msg = (errors?.[0] || '').toLowerCase();

    if (status === 'timedOut' || msg.includes('timeout')) {
      return 'TIMEOUT';
    }

    const infraHints = [
      'no selector for',
      'page closed',
      'target closed',
      'browser closed',
      'execution context was destroyed',
      'cannot find context',
      'navigation has failed',
    ];
    if (infraHints.some((h) => msg.includes(h))) {
      return 'INFRA';
    }

    if (msg.includes('strict mode violation') || msg.includes('resolved to')) {
      const zeroHints = [
        'resolved to 0',
        'found 0',
        'expected 1',
        'received 0',
        'expected 1 element, received 0',
      ];
      if (zeroHints.some((h) => msg.includes(h))) {
        return 'NO_MATCH';
      }
      return 'MULTIPLE_MATCHES';
    }

    const wrongMatchHints = [
      'to be visible',
      'to be attached',
      'to be enabled',
      'to be editable',
      'element is not visible',
      'element is not attached',
      'element is not enabled',
      'element is not editable',
      'to have',
      'expect(',
    ];
    if (wrongMatchHints.some((h) => msg.includes(h))) {
      return 'WRONG_MATCH';
    }

    return 'WRONG_MATCH';
  }

  private readAttachment(a: any): string {
    if (a?.body) return typeof a.body === 'string' ? a.body : Buffer.from(a.body).toString('utf8');
    if (a?.path) return require('fs').readFileSync(a.path, 'utf8');
    return '';
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const proj = test.parent?.project();
    const strategy = (proj?.use as any)?.strategyName;

    let phase: 'baseline' | 'mutated' = 'baseline';
    let scenarioId: string | undefined;
    let category: string | undefined;

    const mutsAttachment = (result.attachments || []).find((a) => a.name === 'mutations');
    if (mutsAttachment) {
      try {
        const txt = this.readAttachment(mutsAttachment);
        if (txt) {
          const obj = JSON.parse(txt);
          const changes: any[] = Array.isArray(obj.changes) ? obj.changes : [];
          if (changes.length > 0) {
            phase = 'mutated';
            scenarioId = changes[0]?.scenarioId;
            category = changes[0]?.category ?? obj?.metadata?.category;

            for (const c of changes) {
              this.muts.write(
                JSON.stringify({
                  runId: this.runId,
                  strategy,
                  testTitle: test.title,
                  ...c, // scenarioId, operator, selector, success, elementsFound, elementIndex, elementInfo, (category if present) ...
                }) + '\n',
              );
              this.mutsCount++;
            }
          }
        }
      } catch {}
    }

    const errors = result.errors?.map((e) => e.message) ?? [];
    const failureType = this.deriveFailureType(errors, result.status);

    this.runs.write(
      JSON.stringify({
        runId: this.runId,
        strategy,
        title: test.title,
        status: result.status,
        durationMs: result.duration,
        failureType,
        phase,
        scenarioId,
        category,
        errors,
      }) + '\n',
    );
  }

  onEnd() {
    this.runs.end();
    this.muts.end();

    if (this.mutsCount === 0) {
      try {
        if (fs.existsSync(this.mutsPath)) {
          fs.unlinkSync(this.mutsPath);
        }
      } catch (e) {}
    }
  }
}
