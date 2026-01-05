import { ChangeScenario } from '../../types/change-types';

export const realworldChangeScenarios: ChangeScenario[] = [
  {
    id: 'rw-content-rebrand-banner',
    name: 'Rebrand banner title',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: '.banner .logo-font',
        data: { text: 'Conduit App' },
        description: 'Rename big hero title from "conduit" to "Conduit App".',
      },
    ],
  },

  {
    id: 'rw-attr-change-article-href',
    name: 'Change /article/* to /articles/*',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: 'a.preview-link[href^="/article/"]',
        data: { attribute: 'href', value: '/articles/placeholder-slug' },
        description: 'Simulate route rename; breaks CSS/XPath that rely on href fragment.',
      },
    ],
  },

  {
    id: 'rw-attr-rename-preview-classes',
    name: 'Rename preview CSS classes',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: '.article-preview',
        data: { attribute: 'class', value: 'card-preview' },
        description: 'Rename .article-preview -> .card-preview.',
      },
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: 'a.preview-link',
        data: { attribute: 'class', value: 'card-link' },
        description: 'Rename .preview-link -> .card-link.',
      },
    ],
  },

  {
    id: 'rw-attr-delete-testids-broad',
    name: 'Remove testids across preview parts',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="article-link-"]',
        data: { attribute: 'data-testid' },
        description: 'Remove testids from preview links.',
      },
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="article-title-"]',
        data: { attribute: 'data-testid' },
        description: 'Remove testids from titles.',
      },
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="article-desc-"]',
        data: { attribute: 'data-testid' },
        description: 'Remove testids from descriptions.',
      },
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="read-more-"]',
        data: { attribute: 'data-testid' },
        description: 'Remove testids from "Read more…".',
      },
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="author-"]',
        data: { attribute: 'data-testid' },
        description: 'Remove testids from author/meta blocks.',
      },
    ],
  },

  {
    id: 'rw-aria-change-favorite-to-link',
    name: 'Change favorite button role',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: 'app-favorite-button button.btn-sm, app-favorite-button button.btn',
        data: { attribute: 'role', value: 'link' },
        description: 'Switch ARIA role from button → link (Role strategy hit).',
      },
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'app-favorite-button button.btn-sm, app-favorite-button button.btn',
        data: { text: '' },
        description: 'Remove number text to make it icon-only (affects name).',
      },
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: 'app-favorite-button button.btn-sm, app-favorite-button button.btn',
        data: { attribute: 'aria-label' },
        description: 'Drop aria-label to remove accessible name (Role stress).',
      },
    ],
  },

  {
    id: 'rw-content-rename-read-more',
    name: 'Rename Read more…',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: '[data-testid^="read-more-"], a.preview-link span',
        data: { text: 'Continue' },
        description: 'Rename Read more… → Continue.',
      },
    ],
  },

  {
    id: 'rw-struct-insert-skeleton-card',
    name: 'Insert a skeleton card before first preview',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: 'app-article-list .col-md-9, app-article-list',
        data: {
          html: '<div class="article-preview skeleton" data-mutation-id="rw-skel-1"><div class="article-meta"></div><div class="preview-link"><h1>Loading…</h1><p></p></div></div>',
          position: 'prepend',
          marker: 'rw-skel-1',
        },
        description: 'Adds a non-interactive skeleton card at the top.',
      },
    ],
  },

  {
    id: 'rw-attribute-hide-sidebar-tags',
    name: 'Hide sidebar tag list',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeModify',
        selector: '[data-testid="tag-list"]',
        data: { attribute: 'style', value: 'display:none !important;' },
        description: 'Hide popular tags block (impacts tag-filter test).',
      },
    ],
  },

  {
    id: 'rw-struct-wrap-preview-inner',
    name: 'Wrap inner preview content',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: 'app-article-preview .article-preview',
        data: {
          html: '<section class="preview-inner-wrap" data-mutation-id="rw-wrap-inner"></section>',
          position: 'wrap',
          marker: 'rw-wrap-inner',
        },
        description: 'Wrap .article-preview to deepen nesting (CSS/XPath robustness).',
      },
    ],
  },

  {
    id: 'rw-struct-reorder-preview-children',
    name: 'Reorder meta and link blocks',
    changes: [
      {
        category: 'structure',
        operator: 'TreeMove',
        selector: 'app-article-preview .article-preview',
        data: {
          mode: 'moveFirstChildToEnd',
          childSelector: '> *',
          marker: 'rw-reorder-children',
        },
        description: 'Rotate children to break nth/first-child assumptions.',
      },
    ],
  },

  {
    id: 'rw-aria-nav-iconize',
    name: 'Make Home link icon-only',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: '[data-testid="nav-home"]',
        data: { text: '' },
        description: 'Remove visible text from Home link.',
      },
      {
        category: 'attribute',
        operator: 'AttributeAdd',
        selector: '[data-testid="nav-home"]',
        data: { attribute: 'aria-label', value: 'Home' },
        description: 'Add aria-label so AT still has a name (different name source).',
      },
    ],
  },

  {
    id: 'rw-content-date-iso',
    name: 'Switch article date to ISO',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: '[data-testid="article-date"]',
        data: { text: '2025-11-24' },
        description: 'Change date rendering format.',
      },
    ],
  },

  {
    id: 'rw-content-author-avatar-only',
    name: 'Remove author link text (avatar-only)',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: '[data-testid^="author-name-"]',
        data: { text: '' },
        description: 'Clear author link text.',
      },
      {
        category: 'attribute',
        operator: 'AttributeAdd',
        selector: '[data-testid^="author-link-"]',
        data: { attribute: 'aria-label', value: 'Author profile' },
        description: 'Add aria-label to the avatar link.',
      },
    ],
  },

  {
    id: 'rw-content-rename-brand',
    name: 'Rename navbar brand text',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'nav .navbar-brand[href="/"]',
        data: { text: 'Conduit App' },
        description: 'Rename visible brand link text',
      },
    ],
  },

  {
    id: 'rw-struct-wrap-list',
    name: 'Wrap article list container',
    changes: [
      {
        category: 'structure',
        operator: 'TreeInsert',
        selector: '.col-md-9',
        data: {
          html: '<section class="mutation-wrapper"></section>',
          position: 'wrap',
          marker: 'rw-wrap-list',
        },
        description: 'Wrap feed column to simulate layout refactor',
      },
    ],
  },

  {
    id: 'rw-struct-move-first-card',
    name: 'Move first article preview to end',
    changes: [
      {
        category: 'structure',
        operator: 'TreeMove',
        selector: 'app-article-list',
        data: {
          mode: 'moveFirstChildToEnd',
          childSelector: 'app-article-preview',
          marker: 'rw-move-first-preview-to-end',
        },
        description: 'Reorder previews (break nth/index assumptions)',
      },
    ],
  },

  {
    id: 'rw-attr-delete-article-testids',
    name: 'Remove data-testid from article elements',
    changes: [
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="article-"]',
        data: { attribute: 'data-testid' },
        description: 'Delete testids on article previews/links/titles',
      },
      {
        category: 'attribute',
        operator: 'AttributeDelete',
        selector: '[data-testid^="favorite-btn-"]',
        data: { attribute: 'data-testid' },
        description: 'Delete favorite button testids',
      },
    ],
  },

  {
    id: 'rw-content-append-title',
    name: 'Append "!" to preview titles',
    changes: [
      {
        category: 'content',
        operator: 'ContentModify',
        selector: 'app-article-preview .preview-link > h1',
        data: { append: true, appendText: '!' },
        description: 'Add punctuation to titles without changing structure',
      },
    ],
  },
];
