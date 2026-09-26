import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CalloutComponent } from './CalloutComponent';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { type?: string; eyebrow?: string; title?: string }) => ReturnType;
      toggleCallout: (attributes?: {
        type?: string;
        eyebrow?: string;
        title?: string;
      }) => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'decision',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'decision',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
      eyebrow: {
        default: 'DECISION RECORD · 04',
        parseHTML: (element) => element.getAttribute('data-eyebrow') || 'DECISION RECORD · 04',
        renderHTML: (attributes) => ({
          'data-eyebrow': attributes.eyebrow,
        }),
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') || '',
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});
