import { ChangeScenario } from '../../types/change-types';

export const todoMvcChangeScenarios: ChangeScenario[] = [
  {
    id: 'todomvc-placeholder-changes',
    name: 'TodoMVC placeholder modification',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: '#todo-input',
        data: { attribute: 'placeholder', value: 'A new item' },
      },
    ],
  },

  {
    id: 'todomvc-attribute-add',
    name: 'Add class to input',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeAdd',
        selector: '[data-testid="text-input"], #todo-input',
        data: { attribute: 'class', value: 'mutated-input' },
        description: 'Add a synthetic class to the new-todo input',
      },
    ],
  },

  {
    id: 'todomvc-attribute-delete',
    name: 'Remove testid attribute from items',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid="todo-item"]',
        data: { attribute: 'data-testid' },
        description: 'Remove data-testid from todo item elements',
      },
    ],
  },

  {
    id: 'todomvc-attribute-modify',
    name: 'Modify item style (inline)',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: '[data-testid="todo-item"], ul.todo-list li',
        data: { attribute: 'style', value: 'background-color: yellow;' },
        description: 'Change inline style of todo items',
      },
    ],
  },

  {
    id: 'todomvc-tree-insert',
    name: 'Insert a fake todo item',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: 'ul.todo-list',
        data: {
          html:
            '<li class="injected" data-mutation-id="injected-todo-1">' +
            '<div class="view">' +
            '<input class="toggle" type="checkbox" data-testid="todo-item-toggle">' +
            '<label data-testid="todo-item-label">Injected ToDo</label>' +
            '<button class="destroy" data-testid="todo-item-button"></button>' +
            '</div></li>',
          position: 'prepend',
          marker: 'injected-todo-1',
        },
        description: 'Insert a synthetic todo item into the list',
      },
    ],
  },

  {
    id: 'todomvc-tree-move',
    name: 'Move first item to end',
    changes: [
      {
        category: 'structure',
        operator: 'TreeMove',
        selector: 'ul.todo-list',
        data: {
          mode: 'moveFirstChildToEnd',
          childSelector: 'li',
          marker: 'todomvc-move-first-li-to-end',
        },
        description: 'Reorder previews (break nth/index assumptions)',
      },
    ],
  },

  {
    id: 'todomvc-content-append',
    name: 'Append exclamation to todo text',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'ul.todo-list li label',
        data: { append: true, appendText: '!' },
        description: "Append '!' to the end of each todo label",
      },
    ],
  },

  {
    id: 'todomvc-attr-change-input-id-class',
    name: 'Rename header input id & class',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: '#todo-input, input.new-todo',
        data: { attribute: 'id', value: 'task-input' },
        description: 'Change header input id to task-input',
      },
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: '#task-input, input.new-todo',
        data: { attribute: 'class', value: 'task-field' },
        description: 'Change header input class to task-field',
      },
    ],
  },

  {
    id: 'todomvc-attr-delete-input-testid',
    name: 'Remove data-testid from header input',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '#todo-input, input.new-todo, [data-testid="text-input"]',
        data: { attribute: 'data-testid' },
        description: "Remove testid so TestId strategy must fall back (it can't)",
      },
    ],
  },

  {
    id: 'todomvc-content-rename-header-label',
    name: 'Rename visually-hidden label for header input',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'label[for="todo-input"], label[for="task-input"]',
        data: { text: 'Add a task' },
        description: 'Rename header input label text',
      },
    ],
  },

  {
    id: 'todomvc-aria-change-list-role',
    name: 'Change UL role from list → listbox',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: 'ul.todo-list',
        data: { attribute: 'role', value: 'listbox' },
        description: 'Simulate semantic refactor of list role',
      },
    ],
  },

  {
    id: 'todomvc-aria-change-checkbox-role',
    name: 'Change checkbox role to switch',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: "ul.todo-list li input.toggle[type='checkbox']",
        data: { attribute: 'role', value: 'switch' },
        description: 'Simulate accessibility role change on toggle',
      },
    ],
  },

  {
    id: 'todomvc-aria-change-delete-button-role',
    name: 'Change delete button role to presentation',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: 'ul.todo-list li button.destroy',
        data: { attribute: 'role', value: 'presentation' },
        description: 'Simulate refactor removing button semantics',
      },
    ],
  },

  {
    id: 'todomvc-struct-wrap-list',
    name: 'Wrap the todo list in a container',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: 'ul.todo-list',
        data: {
          html: '<div class="list-wrapper" data-mutation-id="todomvc-wrap-list"></div>',
          position: 'wrap',
          marker: 'todomvc-wrap-list',
        },
        description: 'Wrap UL in a new container',
      },
    ],
  },

  {
    id: 'todomvc-struct-duplicate-empty-list',
    name: 'Insert a second (empty) todo list before the real one',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: "main.main, [data-testid='main']",
        data: {
          html: '<ul class="todo-list" data-mutation-id="todomvc-empty-list"></ul>',
          position: 'prepend',
          marker: 'todomvc-empty-list',
        },
        description: 'Add an empty UL.todo-list at top of main',
      },
    ],
  },

  {
    id: 'todomvc-struct-wrap-item-view',
    name: 'Wrap each item .view in a container',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: 'ul.todo-list li .view',
        data: {
          html: '<section class="view-wrap" data-mutation-id="todomvc-wrap-view"></section>',
          position: 'wrap',
          marker: 'todomvc-wrap-view',
        },
        description: 'Wrap .view block to simulate layout nest',
      },
    ],
  },

  {
    id: 'todomvc-struct-reorder-view-children',
    name: 'Rotate order of checkbox/label/delete within .view',
    changes: [
      {
        category: 'structure',
        operator: 'TreeMove',
        selector: 'ul.todo-list li .view',
        data: {
          mode: 'moveFirstChildToEnd',
          childSelector: 'input.toggle, label, button.destroy',
          marker: 'todomvc-rotate-view-children',
        },
        description: 'Reorder children inside .view',
      },
    ],
  },

  {
    id: 'todomvc-content-prepend-labels',
    name: "Prepend 'Task: ' to each label",
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'ul.todo-list li label',
        data: { prepend: true, prependText: 'Task: ' },
        description: "Prefix labels with 'Task: '",
      },
    ],
  },

  {
    id: 'todomvc-content-rename-clear-completed',
    name: "Rename 'Clear completed' button",
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'footer .clear-completed',
        data: { text: 'Remove done' },
        description: 'Rename the clear-completed CTA',
      },
    ],
  },

  {
    id: 'todomvc-attr-delete-item-controls-testids',
    name: 'Remove testids from item controls',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector:
          'ul.todo-list li [data-testid="todo-item-toggle"], ul.todo-list li [data-testid="todo-item-label"], ul.todo-list li [data-testid="todo-item-button"]',
        data: { attribute: 'data-testid' },
        description: 'Remove data-testid from toggle/label/delete',
      },
    ],
  },
];
