import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  RemoveFormatting,
  Sparkles,
  Code2,
  Quote,
  Table as TableIcon,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalloutType } from './CalloutComponent';
import { TableMakerPopover } from './TableMakerPopover';

export const PASTEL_HIGHLIGHT_COLORS = [
  { label: 'Yellow', color: '#FEF08A', dot: '#FACC15', bg: 'bg-pastel-butter-border' },
  { label: 'Mint', color: '#A7F3D0', dot: '#34D399', bg: 'bg-pastel-mint-border' },
  { label: 'Lavender', color: '#DDD6FE', dot: '#A78BFA', bg: 'bg-pastel-lilac-border' },
  { label: 'Sky Blue', color: '#BAE6FD', dot: '#60A5FA', bg: 'bg-pastel-blue-bg' },
  { label: 'Rose Pink', color: '#FBCFE8', dot: '#F472B6', bg: 'bg-pastel-pink-bg' },
];

interface EditorToolbarProps {
  editor: Editor | null;
  isSaving?: boolean;
  lastSavedAt?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isSaving = false,
  lastSavedAt,
}) => {
  const [isCalloutMenuOpen, setIsCalloutMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isTableMakerOpen, setIsTableMakerOpen] = useState(false);

  if (!editor) return null;

  const insertCallout = (type: CalloutType) => {
    let eyebrow = 'DECISION RECORD · 04';
    let title = '';

    if (type === 'decision') {
      eyebrow = 'DECISION RECORD · 04';
      title = 'Architecture Decision';
    } else if (type === 'caution') {
      eyebrow = 'CAUTION';
      title = 'Critical Constraint';
    } else if (type === 'idea') {
      eyebrow = 'IDEA';
      title = 'Concept Note';
    } else if (type === 'reference') {
      eyebrow = 'REFERENCE';
      title = 'External Reference';
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'callout',
        attrs: { type, eyebrow, title },
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Document specific rationale, scope, or background details here...',
              },
            ],
          },
        ],
      })
      .run();

    setIsCalloutMenuOpen(false);
  };

  const applyHighlight = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
    setIsHighlightMenuOpen(false);
  };

  const removeHighlight = () => {
    editor.chain().focus().unsetHighlight().run();
    setIsHighlightMenuOpen(false);
  };

  const words =
    editor.storage?.characterCount?.words?.() ??
    editor.getText().trim().split(/\s+/).filter(Boolean).length;

  const readTimeMins = Math.max(1, Math.ceil(words / 200));

  const isHighlighted = editor.isActive('highlight');
  const activeHighlightColor = editor.getAttributes('highlight')?.color;

  return (
    <div className="w-full bg-surface-warm/80 hover:bg-surface border border-border/80 rounded-2xl p-1.5 flex items-center justify-between gap-2 shadow-xs select-none transition-all">
      {/* Left Formatting Tools */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (⌘B)"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans font-semibold transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('bold')
              ? 'bg-white text-primaryDark shadow-xs'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (⌘I)"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans italic transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('italic')
              ? 'bg-white text-primaryDark shadow-xs'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (⌘U)"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans underline transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('underline')
              ? 'bg-white text-primaryDark shadow-xs'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        {/* Multi-Color Highlighter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsHighlightMenuOpen(!isHighlightMenuOpen)}
            title="Highlight Text"
            className={cn(
              'px-2 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer flex items-center gap-1',
              isHighlighted
                ? 'bg-white text-primaryDark shadow-xs'
                : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
            )}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <div
              className="w-2.5 h-2.5 rounded-full border border-black/10"
              style={{ backgroundColor: activeHighlightColor || '#FEF08A' }}
            />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {isHighlightMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-border shadow-float rounded-2xl p-2 z-40 flex flex-col gap-1.5">
              <div className="text-[10px] font-mono font-bold text-midGray uppercase tracking-wider px-1">
                Highlight Color
              </div>

              <div className="grid grid-cols-5 gap-1.5 py-1 px-0.5">
                {PASTEL_HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => applyHighlight(c.color)}
                    title={c.label}
                    style={{ backgroundColor: c.color }}
                    className={cn(
                      'w-6 h-6 rounded-full border border-black/15 hover:scale-110 transition-transform cursor-pointer shadow-2xs flex items-center justify-center',
                      activeHighlightColor === c.color && 'ring-2 ring-primaryDark/60'
                    )}
                  >
                    {activeHighlightColor === c.color && (
                      <Check className="w-3 h-3 text-primaryDark" />
                    )}
                  </button>
                ))}
              </div>

              {isHighlighted && (
                <button
                  type="button"
                  onClick={removeHighlight}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-sans text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-border/50 pt-1.5"
                >
                  <X className="w-3 h-3" />
                  <span>Remove Highlight</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border/80 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted List"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('bulletList')
              ? 'bg-white text-primaryDark shadow-xs font-semibold'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('orderedList')
              ? 'bg-white text-primaryDark shadow-xs font-semibold'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border/80 mx-1" />

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans font-semibold transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('heading', { level: 2 })
              ? 'bg-white text-primaryDark shadow-xs'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans font-semibold transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('heading', { level: 3 })
              ? 'bg-white text-primaryDark shadow-xs'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-sans text-secondaryGray hover:text-primaryDark hover:bg-white/60 transition-colors cursor-pointer"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden sm:inline">Clear</span>
        </button>

        <div className="w-px h-4 bg-border/80 mx-1" />

        {/* Callout Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCalloutMenuOpen(!isCalloutMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-white/90 text-primaryDark border border-border shadow-xs text-xs font-sans font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-700" />
            <span>Callout</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isCalloutMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsCalloutMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-border shadow-float rounded-full p-1.5 z-40 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                {(
                  [
                    {
                      type: 'decision',
                      icon: CheckCircle2,
                      label: 'Decision Record',
                      className:
                        'bg-[#E8F8F0] hover:bg-[#D4F4E4] border border-emerald-300/80 text-emerald-700',
                    },
                    {
                      type: 'caution',
                      icon: AlertTriangle,
                      label: 'Caution',
                      className:
                        'bg-[#FEF3E8] hover:bg-[#FDE7D2] border border-amber-300/80 text-amber-700',
                    },
                    {
                      type: 'idea',
                      icon: Lightbulb,
                      label: 'Idea',
                      className:
                        'bg-[#F0EEFF] hover:bg-[#E2DEFC] border border-indigo-300/80 text-indigo-700',
                    },
                    {
                      type: 'reference',
                      icon: Bookmark,
                      label: 'Reference',
                      className:
                        'bg-[#EBF6FE] hover:bg-[#D7EDFC] border border-sky-300/80 text-sky-700',
                    },
                  ] as const
                ).map(({ type, icon: Icon, label, className }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      insertCallout(type);
                      setIsCalloutMenuOpen(false);
                    }}
                    title={label}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-xs',
                      className
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Code Block */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('codeBlock')
              ? 'bg-white text-primaryDark shadow-xs font-semibold'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer flex items-center justify-center',
            editor.isActive('blockquote')
              ? 'bg-white text-primaryDark shadow-xs font-semibold'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
          )}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        {/* Table Maker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTableMakerOpen(!isTableMakerOpen)}
            title="Table Maker"
            className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer flex items-center gap-1',
              editor.isActive('table') || isTableMakerOpen
                ? 'bg-white text-primaryDark shadow-xs font-semibold'
                : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Table</span>
          </button>

          <TableMakerPopover
            editor={editor}
            isOpen={isTableMakerOpen}
            onClose={() => setIsTableMakerOpen(false)}
          />
        </div>
      </div>

      {/* Right Meta Stats & Autosave Indicator */}
      <div className="flex items-center gap-3 px-2 text-secondaryGray shrink-0">
        <span className="font-mono text-[10px] text-midGray hidden md:inline">
          {words} words · {readTimeMins}m read
        </span>

        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          {isSaving ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-secondaryGray">Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-secondaryGray">
                {lastSavedAt
                  ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'All changes saved'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
