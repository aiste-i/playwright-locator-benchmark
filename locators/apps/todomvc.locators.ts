import { Locator, Page } from '@playwright/test';
import { StrategyName } from '..';

export interface TodoMVCLocators {
  addTodo(page: Page): Locator;
  list(page: Page): Locator;
  itemNth(page: Page, index: number): Locator;
  itemLabel(item: Locator): Locator;
  itemByText(page: Page, text: string): Locator;
  toggleCheckbox(item: Locator): Locator;
  deleteButton(item: Locator): Locator;
  editInput(item: Locator): Locator; 
}

export const TODO_STRATEGIES = {
  addTodo: {
    getByRole: (page: Page) => page.getByRole('textbox').first(),
    getByTestId: (page: Page) => page.getByTestId('header').getByTestId('text-input'),
    css: (page: Page) => page.locator('#todo-input'),
    xpath: (page: Page) =>
      page.locator('xpath=//input[@id="todo-input"]'),
  },

  list: {
    getByRole: (page: Page) => page.getByRole('main').getByRole('list').first(),
    getByTestId: (page: Page) => page.getByTestId('todo-list'),
    css: (page: Page) => page.locator('ul.todo-list'),
    xpath: (page: Page) =>
      page.locator('xpath=//ul[contains(@class,"todo-list")]'),
  },

  itemNth: {
    getByRole: (page: Page, index: number) =>
      TODO_STRATEGIES.list.getByRole(page).locator('> li').nth(index),
    getByTestId: (page: Page, index: number) =>
      TODO_STRATEGIES.list.getByTestId(page).getByTestId('todo-item').nth(index),
    css: (page: Page, index: number) =>
      TODO_STRATEGIES.list.css(page).locator('> li').nth(index),
    xpath: (page: Page, index: number) =>
      TODO_STRATEGIES.list.xpath(page).locator(`xpath=./li[${index + 1}]`),
  },

  itemLabel: {
    getByRole: (item: Locator) => item.locator('label'),
    getByTestId: (item: Locator) => item.getByTestId('todo-item-label'),
    css: (item: Locator) => item.locator('label'),
    xpath: (item: Locator) => item.locator('xpath=./div[@class="view"]/label'),
  },

  itemByText: {
    getByRole: (page: Page, text: string) =>
      page.getByRole('listitem').filter({ hasText: text }),
    getByTestId: (page: Page, text: string) =>
      page.getByTestId('todo-item').filter({ hasText: text }),
    css: (page: Page, text: string) => page.locator(`li:has-text("${text}")`),
    xpath: (page: Page, text: string) =>
      page.locator(
        `xpath=//li[contains(normalize-space(.), "${text}")]`
      ),
  },

  toggleCheckbox: {
    getByRole: (item: Locator) => item.getByRole('checkbox'),
    getByTestId: (item: Locator) => item.getByTestId('todo-item-toggle'),
    css: (item: Locator) => item.locator('input.toggle[type="checkbox"]'),
    xpath: (item: Locator) => item.locator('xpath=./div[@class="view"]/input[@type="checkbox"]'),
  },

  deleteButton: {
    getByRole: (item: Locator) => item.getByRole('button'),
    getByTestId: (item: Locator) => item.getByTestId('todo-item-button'),
    css: (item: Locator) => item.locator('button.destroy'),
    xpath: (item: Locator) => item.locator('xpath=./div[@class="view"]/button[@class="destroy"]'),
  },

  editInput: {
    getByRole: (item: Locator) => item.getByRole('textbox'),
    getByTestId: (item: Locator) => item.getByTestId('text-input'),
    css: (item: Locator) => item.locator('input[type="text"]'),
    xpath: (item: Locator) =>
      item.locator('xpath=.//input[@type="text"]'),
  },
} as const;

const pick = (strategy: StrategyName) =>
  <K extends keyof typeof TODO_STRATEGIES>(key: K) =>
    (...args: any[]) => {
      const impl = (TODO_STRATEGIES[key] as any)[strategy];
      if (!impl) throw new Error(`No selector for "${String(key)}" under strategy "${strategy}"`);
      return impl(...args);
    };

export function getTodoMVCLocators(strategy: StrategyName): TodoMVCLocators {
  const s = pick(strategy);
  return {
    addTodo: s('addTodo'),
    list: s('list'),
    itemNth: s('itemNth'),
    itemLabel: s('itemLabel'),
    itemByText: s('itemByText'),
    toggleCheckbox: s('toggleCheckbox'),
    deleteButton: s('deleteButton'),
    editInput: s('editInput'),
  };
}
