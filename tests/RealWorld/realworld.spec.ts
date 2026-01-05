import { test, expect } from '../../cfg/custom-fixture';
import { getRealWorldLocators } from '../../locators';

const SLUG = 'react-hooks-best-practices';

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

    const navLinks = page.locator('nav .nav-link');
    await expect(navLinks).toHaveCount(3);
  });

  test('Open article by slug', async ({ page, strategyName }) => {
    const L = getRealWorldLocators(strategyName);

    const link = L.previewLinkBySlug(page, SLUG);
    await link.click();

    await expect(page).toHaveURL(new RegExp(`/article/${SLUG}$`));
    await expect(page.locator('.article-page')).toBeVisible();
  });

  test('Favorite requires auth: clicking favorite redirects to /login', async ({
    page,
    strategyName,
  }) => {
    const L = getRealWorldLocators(strategyName);

    const fav = L.favoriteButtonBySlug(page, SLUG);
    await fav.click();

    await expect(page).toHaveURL(/\/login$|\/register$/);
  });

  test('Sidebar tag chip filters feed', async ({ page, strategyName }) => {
    const L = getRealWorldLocators(strategyName);

    const previews = await page.locator('app-article-preview .article-preview').count();
    await expect(previews).toBeGreaterThan(0);

    const tagName = 'ai';
    const tag = L.sidebarTagChip(page, tagName);
    await tag.click();

    const tagPill = page
      .locator('.feed-toggle .nav .nav-item')
      .filter({ has: page.locator('.ion-pound') });
    await expect(tagPill).toBeVisible();

    const cards = page.locator('app-article-preview .article-preview:visible');
    const n = await cards.count();
    if (n > 0) {
      for (let i = 0; i < n; i++) {
        const card = cards.nth(i);
        await expect(card.locator('.tag-list')).toContainText(tagName, { timeout: 2000 });
      }
    }
  });
});
