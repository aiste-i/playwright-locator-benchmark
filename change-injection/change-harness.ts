import { Page } from '@playwright/test';
import { AppliedChange, Category, ChangeDefinition, ChangeOperator } from '../types/change-types';
import { todoMvcChangeScenarios, realworldChangeScenarios } from './scenarios';
import { changeOperators } from './change-operators';

export class ChangeInjectionHarness {
  protected page: Page;
  private appliedChanges: AppliedChange[] = [];
  private mutationMarkers: string[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async cleanupMutations(): Promise<void> {
    if (this.mutationMarkers.length === 0) return;

    try {
      await this.page.evaluate((markers) => {
        markers.forEach((marker: string) => {
          const elements = document.querySelectorAll(`[data-mutation-id="${marker}"]`);
          elements.forEach((el) => {
            if (el.hasAttribute('data-mutation-id') && el.children.length > 0) {
              const parent = el.parentElement;
              if (parent) {
                while (el.firstChild) {
                  parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
              }
            } else {
              el.remove();
            }
          });
        });
      }, this.mutationMarkers);

      this.mutationMarkers = [];
      this.appliedChanges = [];
    } catch (error) {
      console.warn('Failed to cleanup mutations:', error);
    }
  }

  getScenarioIds(): string[] {
    try {
      const all = [...todoMvcChangeScenarios, ...realworldChangeScenarios];
      return all.map((s) => s.id);
    } catch (error) {
      return [];
    }
  }

  async ensureScenarioApplied(scenarioId: string, timeoutMs = 3000): Promise<AppliedChange[]> {
    const all = [...todoMvcChangeScenarios, ...realworldChangeScenarios];
    const scenario = all.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

    const selectors = scenario.changes.map((c) => c.selector).filter(Boolean) as string[];

    const start = Date.now();
    let matched = false;
    for (const sel of selectors) {
      const remaining = Math.max(0, timeoutMs - (Date.now() - start));
      if (remaining <= 0) continue;
      try {
        await this.page.waitForSelector(sel, { timeout: remaining });
        matched = true;
        break;
      } catch (err) {}
    }

    if (!matched) {
      const remainingTotal = Math.max(0, timeoutMs - (Date.now() - start));
      if (remainingTotal > 0) await this.page.waitForTimeout(Math.min(500, remainingTotal));
      for (const sel of selectors) {
        try {
          const count = await this.page.locator(sel).count();
          if (count > 0) {
            matched = true;
            break;
          }
        } catch (e) {}
      }
    }

    if (!matched) {
      return [];
    }

    return await this.applyChangeScenario(scenarioId);
  }

  async applyChangeScenario(scenarioId: string): Promise<AppliedChange[]> {
    const all = [...todoMvcChangeScenarios, ...realworldChangeScenarios];
    const scenario = all.find((s) => s.id === scenarioId);
    if (!scenario) {
      const availableIds = all
        .map((s) => s.id)
        .slice(0, 10)
        .join(', ');
      throw new Error(
        `Scenario with id "${scenarioId}" not found. ` +
          `Available scenarios (first 10): ${availableIds}${all.length > 10 ? '...' : ''}`,
      );
    }

    if (!scenario.changes || scenario.changes.length === 0) {
      throw new Error(`Scenario "${scenarioId}" has no changes defined`);
    }

    for (const change of scenario.changes) {
      if (!change.operator) {
        throw new Error(`Scenario "${scenarioId}" has a change without an operator`);
      }
      if (!change.selector) {
        throw new Error(`Scenario "${scenarioId}" has a change without a selector`);
      }
      if (!change.category) {
        throw new Error(`Scenario "${scenarioId}" has a change without a category`);
      }
    }

    console.log(`Applying scenario: ${scenario.name}`);

    const changes: AppliedChange[] = [];

    for (const changeDef of scenario.changes) {
      const changeResults = await this.applyChangeDefinition(changeDef, scenarioId);
      changes.push(...changeResults);
    }

    this.appliedChanges.push(...changes);

    const successfulChanges = changes.filter((c) => c.success).length;
    console.log(
      `Scenario "${scenario.name}" applied. ${successfulChanges}/${changes.length} changes successful.`,
    );

    return changes;
  }

  private async applyChangeDefinition(
    changeDef: ChangeDefinition,
    scenarioId: string,
  ): Promise<AppliedChange[]> {
    try {
      if (changeDef && typeof changeDef.selector === 'string' && changeDef.selector.length > 0) {
        const isSimpleSelector =
          !changeDef.selector.startsWith('xpath=') &&
          !changeDef.selector.startsWith('//') &&
          changeDef.selector.length < 200;

        if (isSimpleSelector) {
          for (let i = 0; i < 3; i++) {
            try {
              const timeout = 300 * (i + 1);
              await this.page.waitForSelector(changeDef.selector, { timeout });
              break;
            } catch (e) {
              if (i === 2) {
                console.warn(`Selector "${changeDef.selector}" not found after retries`);
              } else {
                await this.page.waitForTimeout(100 * Math.pow(2, i));
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('waitForSelector failed or skipped for', changeDef.selector, e?.message || e);
    }

    return this.page
      .evaluate(
        ({ changeDef, scenarioId, operators }) => {
          const processTemplateData = (data: any, index: number, element: Element): any => {
            if (!data) return data;

            const processed = JSON.parse(JSON.stringify(data));

            if (processed.value && typeof processed.value === 'string') {
              processed.value = processed.value
                .replace(/{counter}/g, index.toString())
                .replace(/{tagName}/g, element.tagName.toLowerCase())
                .replace(/{text}/g, element.textContent?.substring(0, 20) || 'element');
            }

            if (processed.text && typeof processed.text === 'string') {
              processed.text = processed.text
                .replace(/{counter}/g, index.toString())
                .replace(/{original}/g, element.textContent || '')
                .replace(/{tagName}/g, element.tagName.toLowerCase());
            }

            return processed;
          };

          const operatorFunctions: Record<string, Function> = {};
          operators.forEach((op) => {
            try {
              operatorFunctions[op.name] = new Function('return ' + op.apply)();
            } catch (error) {
              throw new Error(`Failed to parse operator "${op.name}": ${error}`);
            }
          });

          const markers: string[] = [];

          try {
            if (!changeDef.selector || typeof changeDef.selector !== 'string') {
              throw new Error(`Invalid selector: ${changeDef.selector}`);
            }

            if (!changeDef.operator || !operatorFunctions[changeDef.operator]) {
              throw new Error(`Invalid operator: ${changeDef.operator}`);
            }

            if (changeDef.selector.startsWith('xpath=') || changeDef.selector.startsWith('//')) {
              throw new Error(
                `XPath selectors are not supported in change scenarios. Use CSS selectors instead. Found: "${changeDef.selector}"`,
              );
            }

            const elements = Array.from(document.querySelectorAll(changeDef.selector));
            const results: any[] = [];

            if (elements.length === 0) {
              console.warn(`No elements found for selector: "${changeDef.selector}"`);
              results.push({
                scenarioId,
                category: changeDef.category,
                operator: changeDef.operator,
                selector: changeDef.selector,
                success: false,
                description: changeDef.description,
                elementsFound: 0,
              });
              return { results, markers };
            }

            console.log(`Selector "${changeDef.selector}" found ${elements.length} elements`);

            const operator = operatorFunctions[changeDef.operator];

            elements.forEach((element, index) => {
              try {
                const originalAttributes: Record<string, string> = {};
                Array.from(element.attributes).forEach((attr) => {
                  originalAttributes[attr.name] = attr.value;
                });

                const elementInfo = {
                  tagName: element.tagName,
                  originalText: element.textContent?.substring(0, 50) || undefined,
                  originalAttributes,
                };

                let processedData = processTemplateData(changeDef.data, index, element);

                if (processedData?.marker && typeof processedData.marker === 'string') {
                  if (!markers.includes(processedData.marker)) {
                    markers.push(processedData.marker);
                  }
                }

                const success = operator(element, processedData);

                results.push({
                  scenarioId,
                  category: changeDef.category,
                  operator: changeDef.operator,
                  selector: changeDef.selector,
                  success,
                  description: changeDef.description,
                  elementInfo,
                  elementsFound: elements.length,
                  elementIndex: index,
                });
              } catch (error) {
                results.push({
                  scenarioId,
                  category: changeDef.category,
                  operator: changeDef.operator,
                  selector: changeDef.selector,
                  success: false,
                  description: changeDef.description,
                  error: (error as Error).message,
                  elementIndex: index,
                });
              }
            });

            return { results, markers };
          } catch (error) {
            console.error(`Error processing selector "${changeDef.selector}":`, error);
            return {
              results: [
                {
                  scenarioId,
                  category: changeDef.category,
                  operator: changeDef.operator,
                  selector: changeDef.selector,
                  success: false,
                  description: changeDef.description,
                  error: `Selector error: ${(error as Error).message}`,
                },
              ],
              markers: [],
            };
          }
        },
        {
          changeDef,
          scenarioId,
          operators: changeOperators.map((op) => ({
            name: op.name,
            apply: op.apply,
          })),
        },
      )
      .then((browserResult: { results: any[]; markers: string[] }) => {
        browserResult.markers.forEach((marker) => {
          if (!this.mutationMarkers.includes(marker)) {
            this.mutationMarkers.push(marker);
          }
        });

        return browserResult.results.map((result) => ({
          ...result,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        }));
      });
  }

  getSuccessStats(): { total: number; successful: number; successRate: number } {
    const total = this.appliedChanges.length;
    const successful = this.appliedChanges.filter((c) => c.success).length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return { total, successful, successRate };
  }

  exportChangeData(): string {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalChanges: this.appliedChanges.length,
        successRate: this.getSuccessStats().successRate,
      },
      changes: this.appliedChanges,
    };

    return JSON.stringify(exportData, null, 2);
  }
}
