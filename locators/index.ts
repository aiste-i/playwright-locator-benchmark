export const STRATEGIES = ['getByRole', 'getByTestId', 'css', 'xpath'] as const;
export type StrategyName = (typeof STRATEGIES)[number];

export { getTodoMVCLocators } from './apps/todomvc.locators';
export { getRealWorldLocators } from './apps/realworld.locators';
