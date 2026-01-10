import { test, expect } from '../../cfg/custom-fixture';
import { getTodoMVCLocators } from '../../locators';

const todos = ['Buy groceries', 'Walk the dog', 'Read a book'];

function isContentScenario(): boolean {
  const scenarioId = process.env.SCENARIO_ID ?? '';
  return scenarioId.includes('content');
}

function oracleTodoItems(page: any) {
  return page.locator('section.todoapp ul.todo-list > li');
}
function oracleFirstTodo(page: any) {
  return oracleTodoItems(page).first();
}
function oracleTodoLabel(todoItem: any) {
  return todoItem.locator('label');
}
function oracleTodoToggle(todoItem: any) {
  return todoItem.locator('input.toggle');
}

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
    return successful > 0;
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

    const before = await oracleTodoItems(page).count();

    await input.fill('New Todo Item');
    await input.press('Enter');

    await maybeApply(changeInjection, true);

    await expect(oracleTodoItems(page)).toHaveCount(before + 1);

    await expect(oracleTodoLabel(oracleFirstTodo(page))).toContainText('New Todo Item');
  });

  test('Add multiple todos', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const t of todos) {
      await input.fill(t);
      await input.press('Enter');
    }

    await maybeApply(changeInjection, true);

    const count = await oracleTodoItems(page).count();
    expect(count).toBeGreaterThanOrEqual(todos.length);

    const first = oracleFirstTodo(page);
    await expect(oracleTodoToggle(first)).toBeVisible();
    await expect(oracleTodoLabel(first)).toBeVisible();
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

    const first = oracleFirstTodo(page);
    await expect(oracleTodoToggle(first)).toBeChecked();
    await expect(first).toHaveClass(/completed/);

    await check.uncheck();

    await expect(oracleTodoToggle(first)).not.toBeChecked();
    await expect(first).not.toHaveClass(/completed/);
  });

  test('Edit first todo', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const todo of todos) {
      await input.fill(todo);
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

    const firstLabel = oracleTodoLabel(oracleFirstTodo(page));
    if (isContentScenario()) {
      await expect(firstLabel).toContainText(updated);
    } else {
      await expect(firstLabel).toHaveText(updated);
    }
  });

  test('Delete first todo', async ({ page, changeInjection, strategyName }) => {
    const todoLocators = getTodoMVCLocators(strategyName);

    const input = todoLocators.addTodo(page);
    for (const todo of todos) {
      await input.fill(todo);
      await input.press('Enter');
    }

    await maybeApply(changeInjection, true);

    const before = await oracleTodoItems(page).count();

    const item = todoLocators.itemNth(page, 0);
    const del = todoLocators.deleteButton(item);

    await item.hover();
    await del.click();

    await expect(oracleTodoItems(page)).toHaveCount(before - 1);
  });
});
