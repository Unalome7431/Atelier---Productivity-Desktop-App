import React, { useState } from 'react';
import { Table as TableIcon, Plus, Trash2, Columns, Rows, X } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

interface TableMakerPopoverProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export const TableMakerPopover: React.FC<TableMakerPopoverProps> = ({
  editor,
  isOpen,
  onClose,
}) => {
  const [hoveredRows, setHoveredRows] = useState(3);
  const [hoveredCols, setHoveredCols] = useState(3);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);
  const [mode, setMode] = useState<'grid' | 'custom'>('grid');

  if (!isOpen) return null;

  const isInsideTable = editor.isActive('table');

  const handleInsert = (rows: number, cols: number, withHeader: boolean) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: withHeader }).run();
    onClose();
  };

  const maxGridRows = 6;
  const maxGridCols = 6;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover Card */}
      <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-border shadow-float rounded-2xl p-3.5 z-50 flex flex-col gap-3 font-sans select-none animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center text-primaryDark">
              <TableIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-bold text-sm text-primaryDark">Table Maker</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-surface cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* In-Table Context Actions (when cursor is currently inside a table) */}
        {isInsideTable && (
          <div className="flex flex-col gap-2 bg-surface/60 rounded-xl p-2.5 border border-border/80">
            <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
              Current Table Actions
            </span>

            {/* Column & Row Adjustments */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-secondaryGray hover:text-primaryDark hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <Columns className="w-3 h-3 text-indigo-600" />
                <span>+ Column Left</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-secondaryGray hover:text-primaryDark hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <Columns className="w-3 h-3 text-indigo-600" />
                <span>+ Column Right</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addRowBefore().run();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-secondaryGray hover:text-primaryDark hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <Rows className="w-3 h-3 text-emerald-600" />
                <span>+ Row Above</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().addRowAfter().run();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-secondaryGray hover:text-primaryDark hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <Rows className="w-3 h-3 text-emerald-600" />
                <span>+ Row Below</span>
              </button>
            </div>

            {/* Delete row / column / table */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteColumn().run();
                  onClose();
                }}
                className="text-secondaryGray hover:text-rose-600 cursor-pointer px-1 py-0.5 rounded hover:bg-rose-50"
              >
                Delete Col
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteRow().run();
                  onClose();
                }}
                className="text-secondaryGray hover:text-rose-600 cursor-pointer px-1 py-0.5 rounded hover:bg-rose-50"
              >
                Delete Row
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  onClose();
                }}
                className="text-rose-600 font-medium hover:text-rose-700 cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Table</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-surface p-0.5 rounded-lg border border-border/70 text-xs">
          <button
            type="button"
            onClick={() => setMode('grid')}
            className={cn(
              'flex-1 py-1 rounded-md text-center font-medium transition-colors cursor-pointer',
              mode === 'grid'
                ? 'bg-white text-primaryDark shadow-xs font-semibold'
                : 'text-secondaryGray hover:text-primaryDark'
            )}
          >
            Visual Grid
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={cn(
              'flex-1 py-1 rounded-md text-center font-medium transition-colors cursor-pointer',
              mode === 'custom'
                ? 'bg-white text-primaryDark shadow-xs font-semibold'
                : 'text-secondaryGray hover:text-primaryDark'
            )}
          >
            Custom Sizing
          </button>
        </div>

        {/* Mode 1: Interactive Visual Grid */}
        {mode === 'grid' && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full px-1">
              <span className="font-mono text-mono-xs font-semibold text-primaryDark">
                {hoveredRows} × {hoveredCols} Table
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-secondaryGray cursor-pointer">
                <input
                  type="checkbox"
                  checked={withHeaderRow}
                  onChange={(e) => setWithHeaderRow(e.target.checked)}
                  className="rounded text-primaryDark cursor-pointer"
                />
                <span>Header Row</span>
              </label>
            </div>

            {/* 6x6 Grid of cells */}
            <div
              className="grid gap-1 p-2 bg-surface/50 rounded-xl border border-border/80"
              style={{
                gridTemplateColumns: `repeat(${maxGridCols}, minmax(0, 1fr))`,
              }}
              onMouseLeave={() => {
                setHoveredRows(3);
                setHoveredCols(3);
              }}
            >
              {Array.from({ length: maxGridRows }).map((_, rIdx) => {
                const row = rIdx + 1;
                return Array.from({ length: maxGridCols }).map((_, cIdx) => {
                  const col = cIdx + 1;
                  const isHighlighted = row <= hoveredRows && col <= hoveredCols;
                  const isHeader = withHeaderRow && row === 1 && isHighlighted;

                  return (
                    <button
                      key={`${row}_${col}`}
                      type="button"
                      onMouseEnter={() => {
                        setHoveredRows(row);
                        setHoveredCols(col);
                      }}
                      onClick={() => handleInsert(row, col, withHeaderRow)}
                      title={`${row} rows × ${col} columns`}
                      className={cn(
                        'w-7 h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center',
                        isHighlighted
                          ? isHeader
                            ? 'bg-accent-indigo border-indigo-300 text-indigo-950 font-bold'
                            : 'bg-accent-green border-emerald-300 text-emerald-950'
                          : 'bg-white border-border/80 hover:border-midGray'
                      )}
                    />
                  );
                });
              })}
            </div>
            <span className="font-sans text-[11px] text-secondaryGray">
              Hover to select dimensions, click to insert
            </span>
          </div>
        )}

        {/* Mode 2: Custom Rows & Columns Form */}
        {mode === 'custom' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInsert(Math.max(1, customRows), Math.max(1, customCols), withHeaderRow);
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-mono-xs font-semibold text-secondaryGray uppercase">
                  Columns
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={customCols}
                  onChange={(e) => setCustomCols(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primaryDark font-mono font-semibold outline-none focus:border-border-focus"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-mono-xs font-semibold text-secondaryGray uppercase">
                  Rows
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={customRows}
                  onChange={(e) => setCustomRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primaryDark font-mono font-semibold outline-none focus:border-border-focus"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-primaryDark cursor-pointer py-1">
              <input
                type="checkbox"
                checked={withHeaderRow}
                onChange={(e) => setWithHeaderRow(e.target.checked)}
                className="rounded text-primaryDark cursor-pointer"
              />
              <span>Include Header Row</span>
            </label>

            <Button type="submit" variant="primary" size="sm" className="w-full">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>
                Insert {customRows} × {customCols} Table
              </span>
            </Button>
          </form>
        )}
      </div>
    </>
  );
};
