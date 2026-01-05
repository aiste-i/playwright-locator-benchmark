export interface ChangeScenario {
  id: string;
  name: string;
  changes: ChangeDefinition[];
}

export type Category = 'attribute' | 'content' | 'structure';

export interface ChangeDefinition {
  category: Category;
  operator:
    | 'AttributeModify'
    | 'AttributeAdd'
    | 'AttributeDelete'
    | 'ContentModify'
    | 'TreeInsert'
    | 'TreeMove';
  selector: string;
  data?: any;
  description?: string;
}

export interface AppliedChange {
  id: string;
  scenarioId: string;
  operator: string;
  selector: string;
  category: string;
  success: boolean;
  description: string;
  timestamp: Date;
  elementInfo?: {
    tagName: string;
    originalText?: string;
    originalAttributes?: Record<string, string>;
  };
  error?: string;
}

export interface ChangeOperator {
  name: string;
  apply: string;
}
