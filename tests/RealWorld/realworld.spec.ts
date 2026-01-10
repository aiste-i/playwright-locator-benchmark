import { test, expect } from '../../cfg/custom-fixture';
import { getRealWorldLocators } from '../../locators';

const SLUG = 'react-hooks-best-practices';

function oracleNavLinks(page: any) {
  return page.locator('nav .nav-link');
}

function oracleArticlePage(page: any) {
  return page.locator('.article-page');
}

function oraclePreviewCards(page: any) {
  return page.locator('app-article-preview .article-preview:visible, .article-preview:visible');
}

function oracleFeedRegion(page: any) {
  return page.locator('app-article-list, .article-list');
}

function oracleTagPillInFeedToggle(page: any) {
  return page.locator('.feed-toggle .nav .nav-item').filter({ has: page.locator('.ion-pound') });
}

function isContentScenario(): boolean {
  const scenarioId = process.env.SCENARIO_ID ?? '';
  return scenarioId.includes('content');
}

test.describe('RealWorld — locator benchmark', () => {
  test.beforeEach(async ({ page, changeInjection }) => {
    const realworldUrl = process.env.REALWORLD_URL || 'http://localhost:4200/';

    await page.goto(realworldUrl, { waitUntil: 'networkidle' });

    await page.waitForSelector('nav, app-article-list, .navbar', { timeout: 5000 }).catch(() => {});

    const phase = (process.env.PHASE as 'baseline' | 'mutated') ?? 'baseline';
    const scenarioId = process.env.SCENARIO_ID;
    if (phase === 'mutated' && scenarioId) {
      const results = await changeInjection.ensureScenarioApplied(scenarioId, 5000);
      if (results.length === 0) {
        throw new Error(
          `Scenario "${scenarioId}" matched no elements - mutations may not have been applied. Test cannot proceed.`,
        );
      }
      const successful = results.filter((r) => r.success).length;
      if (successful === 0 && results.length > 0) {
        throw new Error(
          `Scenario "${scenarioId}" failed to apply any mutations. All ${results.length} changes failed.`,
        );
      }
    }
  });

  test('Nav links are present', async ({ page, strategyName }) => {
    const L = getRealWorldLocators(strategyName);

    await expect(L.headerBrand(page)).toBeVisible();
    await expect(L.navHome(page)).toBeVisible();
    await expect(L.navSignIn(page)).toBeVisible();
    await expect(L.navSignUp(page)).toBeVisible();

    await expect(oracleNavLinks(page)).toHaveCount(3);
  });

  test('Open article by slug', async ({ page, strategyName }) => {
    const L = getRealWorldLocators(strategyName);

    await L.previewLinkBySlug(page, SLUG).click();

    await expect(page).toHaveURL(new RegExp(`/article/${SLUG}$`));
    await expect(oracleArticlePage(page)).toBeVisible();
  });

  test('Favorite requires auth: clicking favorite redirects to /login', async ({ page, strategyName }) => {
    const L = getRealWorldLocators(strategyName);

    await L.favoriteButtonBySlug(page, SLUG).click();

    await expect(page).toHaveURL(/\/login$|\/register$/);
  });

test('Navigation and article interaction chain', async ({ page, strategyName }) => {
  const L = getRealWorldLocators(strategyName);
  const baseUrl = process.env.REALWORLD_URL || 'http://localhost:4200/';

  await L.navSignIn(page).click();

  await expect(page).toHaveURL(/\/login$/);

  await L.headerBrand(page).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(oracleFeedRegion(page)).toBeVisible();

  await L.previewLinkBySlug(page, SLUG).click();

  await expect(page).toHaveURL(new RegExp(`/article/${SLUG}$`));
  await expect(oracleArticlePage(page)).toBeVisible();

  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  await L.favoriteButtonBySlug(page, SLUG).click();

  await expect(page).toHaveURL(/\/login$|\/register$/);
});

  test('Sidebar tag chip filters feed', async ({ page, strategyName }) => {
    if( strategyName === 'getByRole' ) {
      test.skip();
    }

    const L = getRealWorldLocators(strategyName);

    await expect(oracleFeedRegion(page)).toBeVisible();
    await expect(oraclePreviewCards(page).first()).toBeVisible();

    const tagName = 'ai';

    await L.sidebarTagChip(page, tagName).click();

    await expect(oracleTagPillInFeedToggle(page)).toBeVisible();

    await expect(oracleFeedRegion(page)).toBeVisible();
    await expect(oraclePreviewCards(page).first()).toBeVisible();

    if (!isContentScenario()) {
      const cards = oraclePreviewCards(page);
      const n = await cards.count();
      for (let i = 0; i < n; i++) {
        await expect(cards.nth(i).locator('.tag-list')).toContainText(tagName, { timeout: 2000 });
      }
    }
  });
});
