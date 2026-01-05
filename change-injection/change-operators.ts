import { ChangeOperator } from '../types/change-types';

export const changeOperators: ChangeOperator[] = [
  {
    name: 'AttributeModify',
    apply: `function(element, data) {
      try {
        if (!data || !data.attribute) return false;
        const cur = element.getAttribute(data.attribute);
        if (cur === data.value) return true; // idempotent
        element.setAttribute(data.attribute, data.value);
        return element.getAttribute(data.attribute) === data.value;
      } catch { return false; }
    }`,
  },
  {
    name: 'AttributeAdd',
    apply: `function(element, data) {
      try {
        if (!data || !data.attribute) return false;
        if (!element.hasAttribute(data.attribute)) {
          element.setAttribute(data.attribute, data.value);
          return element.getAttribute(data.attribute) === data.value;
        }
        // already present → consider success (idempotent add)
        return true;
      } catch { return false; }
    }`,
  },
  {
    name: 'AttributeDelete',
    apply: `function(element, data) {
      try {
        if (!data || !data.attribute) return false;
        if (!element.hasAttribute(data.attribute)) return true; // idempotent
        element.removeAttribute(data.attribute);
        return !element.hasAttribute(data.attribute);
      } catch { return false; }
    }`,
  },

  {
    name: 'ContentModify',
    apply: `function(element, data) {
      try {
        if (!element || !data) return false;
        const current = element.textContent || '';

        if (typeof data.text === 'string') {
          if (current === data.text) return true; // idempotent replace
          element.textContent = data.text;
          return element.textContent === data.text;
        }

        if (data.append && typeof data.appendText === 'string') {
          if (current.endsWith(data.appendText)) return true; // idempotent append
          element.textContent = current + data.appendText;
          return element.textContent.endsWith(data.appendText);
        }

        if (data.prepend && typeof data.prependText === 'string') {
          if (current.startsWith(data.prependText)) return true; // idempotent prepend
          element.textContent = data.prependText + current;
          return element.textContent.startsWith(data.prependText);
        }

        return false;
      } catch { return false; }
    }`,
  },

  {
    name: 'TreeInsert',
    apply: `function(element, data) {
      try {
        if (!element || !data) return false;
        var pos = data.position || 'append';
        var marker = data.marker;

        // global idempotency: if we already inserted a node with this marker anywhere, skip
        if (marker && document.querySelector('[data-mutation-id="' + marker + '"]')) {
          return true;
        }

        function parseNode(html) {
          var tpl = document.createElement('template');
          tpl.innerHTML = (html || '').trim();
          return tpl.content.firstElementChild;
        }

        if (pos === 'wrap') {
          // wrap the target element
          var wrapper = data.html ? parseNode(data.html) : null;
          if (!wrapper) {
            // fallback: construct wrapper
            var tag = data.wrapperTag || 'div';
            wrapper = document.createElement(tag);
            if (data.className) wrapper.className = data.className;
          }
          if (!wrapper) return false;

          if (marker) wrapper.setAttribute('data-mutation-id', marker);

          var parent = element.parentElement;
          if (!parent) return false;

          // idempotency: already wrapped by this marker?
          if (element.parentElement && element.parentElement.getAttribute && element.parentElement.getAttribute('data-mutation-id') === marker) {
            return true;
          }

          parent.insertBefore(wrapper, element);
          wrapper.appendChild(element);
          return true;
        }

        // Non-wrap: insert a new node relative to element
        var node = parseNode(data.html);
        if (!node) return false;
        if (marker) node.setAttribute('data-mutation-id', marker);

        if (pos === 'prepend') {
          element.insertBefore(node, element.firstChild);
        } else if (pos === 'append') {
          element.appendChild(node);
        } else if (pos === 'before') {
          var p = element.parentElement; if (!p) return false;
          p.insertBefore(node, element);
        } else if (pos === 'after') {
          var p2 = element.parentElement; if (!p2) return false;
          p2.insertBefore(node, element.nextSibling);
        } else {
          return false;
        }
        return true;
      } catch { return false; }
    }`,
  },

  {
    name: 'TreeMove',
    apply: `function(container, data) {
      try {
        if (!container || !data || !data.childSelector) return false;
        var mode = data.mode || 'moveFirstChildToEnd';
        var marker = data.marker || ('tree-move-' + mode + '-' + data.childSelector.replace(/[^a-z0-9_-]/gi,''));

        // idempotency: don't repeat on same container
        if (container.getAttribute && container.getAttribute('data-mutation-id') === marker) return true;

        // immediate children only
        var kids = Array.prototype.filter.call(container.children, function(ch) {
          try { return ch.matches(data.childSelector); } catch(e) { return false; }
        });

        if (kids.length < 2) { container.setAttribute('data-mutation-id', marker); return true; }

        if (mode === 'moveFirstChildToEnd') {
          container.appendChild(kids[0]);
        } else if (mode === 'moveLastChildToStart') {
          container.insertBefore(kids[kids.length - 1], container.firstChild);
        } else {
          return false;
        }

        container.setAttribute('data-mutation-id', marker);
        return true;
      } catch { return false; }
    }`,
  },
];
