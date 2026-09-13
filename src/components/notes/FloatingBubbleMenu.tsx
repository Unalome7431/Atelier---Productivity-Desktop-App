import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  RemoveFormatting,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PASTEL_HIGHLIGHT_COLORS } from './EditorToolbar';

interface FloatingBubbleMenuProps {
  editor: Editor | null;
}

export const FloatingBubbleMenu: React.FC<FloatingBubbleMenuProps> = ({ editor }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const { selection } = editor.state;
      const { from, to, empty } = selection;

      if (empty) {
        setIsVisible(false);
        setIsColorPickerOpen(false);
        return;
      }

      try {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        // Position above the selection
        const top = Math.max(10, start.top - 48);
        const left = Math.max(120, (start.left + end.right) / 2);

        setPosition({ top, left });
        setIsVisible(true);
      } catch {
        setIsVisible(false);
      }
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('transaction', updateMenu);

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('transaction', updateMenu);
    };
  }, [editor]);

  if (!editor || !isVisible || !position) return null;

  const isHighlighted = editor.isActive('highlight');
  const activeColor = editor.getAttributes('highlight')?.color;

  const items = [
    {
      label: 'Bold',
      icon: Bold,
      isActive: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      isActive: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Underline',
      icon: UnderlineIcon,
      isActive: editor.isActive('underline'),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: 'Highlight',
      icon: Highlighter,
      isActive: isHighlighted,
      action: () => setIsColorPickerOpen(!isColorPickerOpen),
    },
    {
      label: 'H2',
      icon: Heading2,
      isActive: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'H3',
      icon: Heading3,
      isActive: editor.isActive('heading', { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Bullet List',
      icon: List,
      isActive: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered List',
      icon: ListOrdered,
      isActive: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Code',
      icon: Code,
      isActive: editor.isActive('code'),
      action: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: 'Quote',
      icon: Quote,
      isActive: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Clear Formatting',
      icon: RemoveFormatting,
      isActive: false,
      action: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ];

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 -translate-x-1/2 flex flex-col items-center gap-1 select-none atelier-bubble-menu animate-in fade-in zoom-in-95 duration-75"
    >
      {/* Floating Toolbar Buttons */}
      <div className="bg-white/95 backdrop-blur-xs border border-border shadow-float rounded-full p-1 flex items-center gap-0.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.label}>
              {idx === 4 && <div className="w-px h-4 bg-border/80 mx-0.5" />}
              {idx === 8 && <div className="w-px h-4 bg-border/80 mx-0.5" />}
              {idx === 10 && <div className="w-px h-4 bg-border/80 mx-0.5" />}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action();
                }}
                title={item.label}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer relative',
                  item.isActive
                    ? 'bg-accent-indigo text-indigo-950 font-semibold shadow-xs'
                    : 'text-secondaryGray hover:text-primaryDark hover:bg-surface'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label === 'Highlight' && isHighlighted && (
                  <div
                    className="w-1.5 h-1.5 rounded-full absolute bottom-1 right-1 border border-black/20"
                    style={{ backgroundColor: activeColor || '#FEF08A' }}
                  />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Pastel Highlight Color Swatches Picker */}
      {isColorPickerOpen && (
        <div className="bg-white border border-border shadow-float rounded-full px-2.5 py-1.5 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100">
          <span className="text-[10px] font-mono font-bold text-midGray uppercase tracking-wider">
            Color:
          </span>
          <div className="flex items-center gap-1.5">
            {PASTEL_HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color: c.color }).run();
                  setIsColorPickerOpen(false);
                }}
                title={c.label}
                style={{ backgroundColor: c.color }}
                className={cn(
                  'w-5 h-5 rounded-full border border-black/15 hover:scale-110 transition-transform cursor-pointer shadow-2xs',
                  activeColor === c.color && 'ring-2 ring-primaryDark/60'
                )}
              />
            ))}

            {isHighlighted && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setIsColorPickerOpen(false);
                }}
                title="Remove highlight"
                className="p-1 rounded-full text-secondaryGray hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
