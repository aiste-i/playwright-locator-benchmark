import type { StrategyName } from '../locators';

declare module '@playwright/test' {
  interface TestOptions {
    strategyName: StrategyName;
    phase: 'baseline' | 'mutated';
  }
}
