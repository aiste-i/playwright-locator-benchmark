import { Locator, Page } from '@playwright/test';
import { StrategyName } from '..';

export type ArticleSlug =
  | 'how-to-learn-javascript-efficiently'
  | 'react-hooks-best-practices'
  | 'building-scalable-apis-with-node-js'
  | 'introduction-to-machine-learning-for-developers';

export interface RealWorldLocators {
  headerBrand(page: Page): Locator;
  navHome(page: Page): Locator;
  navSignIn(page: Page): Locator;
  navSignUp(page: Page): Locator;

  previewLinkBySlug(page: Page, slug: ArticleSlug): Locator;
  favoriteButtonBySlug(page: Page, slug: ArticleSlug): Locator;

  sidebarTagChip(page: Page, tag: string): Locator;
}

const REALWORLD_STRATEGIES = {
  headerBrand: {
    getByRole: (page: Page) =>
      page.getByRole('navigation').getByRole('link', { name: /^conduit$/i }),
    getByTestId: (page: Page) => page.getByTestId('site-brand'),
    css: (page: Page) => page.locator('.navbar-brand[href="/"]'),
    xpath: (page: Page) =>
      page.locator('xpath=//a[@href="/" and contains(@class,"navbar-brand")]'),
  },

  navHome: {
    getByRole: (page: Page) =>
      page.getByRole('navigation').getByRole('link', { name: /^\s*home\s*$/i }),
    getByTestId: (page: Page) => page.getByTestId('nav-home'),
    css: (page: Page) => page.locator('a.nav-link[href="/"]'),
    xpath: (page: Page) => page.locator('xpath=//a[@class="nav-link" and @href="/"]'),
  },

  navSignIn: {
    getByRole: (page: Page) =>
      page.getByRole('navigation').getByRole('link', { name: /sign in/i }),
    getByTestId: (page: Page) => page.getByTestId('nav-sign-in'),
    css: (page: Page) => page.locator('a.nav-link[href="/login"]'),
    xpath: (page: Page) =>
      page.locator('xpath=//a[@class="nav-link" and contains(@href, "/login")]'),
  },

  navSignUp: {
    getByRole: (page: Page) =>
      page.getByRole('navigation').getByRole('link', { name: /sign up/i }),
    getByTestId: (page: Page) => page.getByTestId('nav-sign-up'),
    css: (page: Page) => page.locator('a.nav-link[href="/register"]'),
    xpath: (page: Page) =>
      page.locator('xpath=//a[@class="nav-link" and contains(@href, "/register")]'),
  },

  previewLinkBySlug: {
    getByRole: (page: Page, slug: string) =>
      page
        .locator(`app-article-preview:has(a[href="/article/${slug}"])`)
        .getByRole('link')
        .filter({ has: page.locator('h1') }),
    getByTestId: (page: Page, slug: string) =>
      page.getByTestId(`article-link-${slug}`),
    css: (page: Page, slug: string) =>
      page.locator(`a.preview-link[href="/article/${slug}"]`),
    xpath: (page: Page, slug: string) =>
      page.locator(`xpath=//a[@class="preview-link" and contains(@href, "/article/${slug}")]`),
  },

  favoriteButtonBySlug: {
    getByRole: (page: Page, slug: string) =>
      page
        .locator(`app-article-preview:has(a[href="/article/${slug}"])`)
        .getByRole('button'),
    getByTestId: (page: Page, slug: string) =>
      page.getByTestId(`favorite-btn-${slug}`),
    css: (page: Page, slug: string) =>
      page.locator(`app-article-preview:has(a.preview-link[href="/article/${slug}"]) button.btn.btn-sm`),
    xpath: (page: Page, slug: string) =>
      page.locator(`xpath=//app-article-preview[.//a[contains(@href, "/article/${slug}")]]//button[contains(@class, "btn") and contains(@class, "btn-sm")]`),
  },

  sidebarTagChip: {
    getByRole: (page: Page, tag: string) =>
        page.getByRole('link', { name: new RegExp(`^\\s*${tag}\\s*$`, 'i') }),
    getByTestId: (page: Page, tag: string) =>
        page.getByTestId('tag-list').getByTestId(`tag-${tag}`),
    css: (page: Page, tag: string) =>
        page.locator(`a.tag-default.tag-pill`).filter({ hasText: new RegExp(`^\\s*${tag}\\s*$`, 'i') }),
    xpath: (page: Page, tag: string) =>
        page.locator(`xpath=//a[contains(@class, "tag-default") and contains(@class, "tag-pill") and normalize-space(.)="${tag}"]`),
    },
} as const;

const pick = (strategy: StrategyName) =>
  <K extends keyof typeof REALWORLD_STRATEGIES>(key: K) =>
    (...args: any[]) => {
      const impl = (REALWORLD_STRATEGIES[key] as any)[strategy];
      if (!impl) throw new Error(`No selector for "${String(key)}" under strategy "${strategy}"`);
      return impl(...args);
    };

export function getRealWorldLocators(strategy: StrategyName): RealWorldLocators {
  const impl = pick(strategy);
  return {
    headerBrand: impl('headerBrand'),
    navHome: impl('navHome'),
    navSignIn: impl('navSignIn'),
    navSignUp: impl('navSignUp'),

    previewLinkBySlug: impl('previewLinkBySlug'),
    favoriteButtonBySlug: impl('favoriteButtonBySlug'),
    sidebarTagChip: impl('sidebarTagChip'),
  };
}