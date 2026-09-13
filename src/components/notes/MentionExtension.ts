import { Mention } from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';

export const CustomMention = Mention.extend({
  name: 'mention',

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({
          'data-id': attributes.id,
        }),
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => ({
          'data-label': attributes.label,
        }),
      },
      entityType: {
        default: 'note',
        parseHTML: (element) => element.getAttribute('data-entity-type') || 'note',
        renderHTML: (attributes) => ({
          'data-entity-type': attributes.entityType,
        }),
      },
      containerId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-container-id'),
        renderHTML: (attributes) => ({
          'data-container-id': attributes.containerId,
        }),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const entityType = node.attrs.entityType || 'note';
    const label = node.attrs.label || node.attrs.id || '';

    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'mention',
          'data-id': node.attrs.id,
          'data-label': label,
          'data-entity-type': entityType,
          'data-container-id': node.attrs.containerId,
          class:
            'atelier-mention inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-full bg-[#F5F1E8] border border-border text-xs font-mono font-medium text-primaryDark hover:bg-white hover:border-indigo-300 transition-colors cursor-pointer select-none',
        },
        HTMLAttributes
      ),
      `@${label}`,
    ];
  },
});
