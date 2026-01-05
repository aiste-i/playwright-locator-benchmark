import { test as base } from '@playwright/test';
import { ChangeInjectionHarness } from '../change-injection/change-harness';
import { StrategyName } from '../locators';

type CustomFixture = {
  strategyName: StrategyName;
  changeInjection: ChangeInjectionHarness;
};

export const test = base.extend<CustomFixture>({
  strategyName: ['getByRole', { option: true }],
  changeInjection: async ({ page }, use, testInfo) => {
    const changeInjection = new ChangeInjectionHarness(page);

    try {
      await use(changeInjection);
    } finally {
      try {
        const json = changeInjection.exportChangeData();
        await testInfo.attach('mutations', {
          contentType: 'application/json',
          body: json,
        });
      } catch (e) {
        console.warn('Failed to attach mutation data:', e);
      }

      await changeInjection.cleanupMutations();
    }
  },
});

export { expect } from '@playwright/test';
