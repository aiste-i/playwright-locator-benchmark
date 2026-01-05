import { test, expect } from '../../cfg/custom-fixture';
import { getTodoMVCLocators } from '../../locators';

const todos = ['Buy groceries', 'Walk the dog', 'Read a book'];

async function maybeApply(changeInjection: any, validate = false): Promise<boolean> {
  const phase = (process.env.PHASE as 'baseline' | 'mutated') ?? 'baseline';
  const scenarioId = process.env.SCENARIO_ID;
  if (phase === 'mutated' && scenarioId) {
    const results = await changeInjection.ensureScenarioApplied(scenarioId, 2000);
    if (validate && results.length === 0) {
      throw new Error(
        `Scenario "${scenarioId}" matched no elements - mutations may not have been applied`,
      );
    }
    const successful = results.filter((r) => r.success).length;
    if (validate && successful === 0 && results.length > 0) {
      throw new Error(`Scenario "${scenarioId}" failed to apply any mutations`);
    }
    return results.length > 0;
  }
  return false;
}

test.describe('TodoMVC — locator benchmark', () => {
  test.beforeEach(async ({ page }) => {
    const todoMvcUrl = process.env.TODOMVC_URL || 'http://localhost:7002/';
    await page.goto(todoMvcUrl);
    await expect(page.getByTestId('header')).toBeVisible();
  });

  test('Add a new todo', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    const before = await todoLocators.list(page).locator('> li').count();

    await input.fill('New Todo Item');
    await input.press('Enter');

    const list = todoLocators.list(page);
    await expect(list.locator('> li')).toHaveCount(before + 1);

    await maybeApply(changeInjection, true);

    const newItem = todoLocators.itemNth(page, before);
    const label = todoLocators.itemLabel(newItem);
    await expect(label).toContainText('New Todo Item');
  });

  test('Add multiple todos', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const t of todos) {
      await input.fill(t);
      await input.press('Enter');
    }

    await maybeApply(changeInjection, true);

    const list = todoLocators.list(page);
    const count = await list.locator('> li').count();
    expect(count).toBeGreaterThanOrEqual(todos.length);

    const first = todoLocators.itemNth(page, 0);
    await expect(todoLocators.toggleCheckbox(first)).toBeVisible();
    await expect(todoLocators.itemLabel(first)).toBeVisible();
  });

  test('Mark first todo completed and then uncheck', async ({
    page,
    changeInjection,
    strategyName,
  }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const todo of todos) {
      await input.fill(todo);
      await input.press('Enter');
    }

    await maybeApply(changeInjection, true);

    const item = todoLocators.itemNth(page, 0);
    const check = todoLocators.toggleCheckbox(item);

    await check.check();
    await expect(check).toBeChecked();
    await expect(item).toHaveClass(/completed/);

    await check.uncheck();
    await expect(check).not.toBeChecked();
    await expect(item).not.toHaveClass(/completed/);
  });

  test('Edit first todo label', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const t of todos) {
      await input.fill(t);
      await input.press('Enter');
    }

    await maybeApply(changeInjection, true);

    const item = todoLocators.itemNth(page, 0);
    const label = todoLocators.itemLabel(item);
    await label.dblclick();

    const editor = todoLocators.editInput(item);
    const updated = 'Buy groceries and cook dinner';
    await editor.fill(updated);
    await editor.press('Enter');

    await expect(todoLocators.itemLabel(todoLocators.itemNth(page, 0))).toHaveText(updated);
  });

  test('Delete first todo', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const t of todos) {
      await input.fill(t);
      await input.press('Enter');
    }

    await maybeApply(changeInjection, true);

    const list = todoLocators.list(page);
    const before = await list.locator('> li').count();

    const item = todoLocators.itemNth(page, 0);
    const del = todoLocators.deleteButton(item);

    await item.hover();
    await del.click();

    await expect(list.locator('> li')).toHaveCount(before - 1);
  });
});
