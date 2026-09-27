import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export const SidebarCanvasShelf: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const { canvases, activeCanvasId, setActiveCanvasId, createCanvas, renameCanvas, deleteCanvas } =
    useCanvasStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const handleCreateCanvas = async () => {
    const id = await createCanvas();
    setActiveCanvasId(id);
    setActiveTab('canvas');
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameInput(currentTitle);
  };

  const handleFinishRename = (id: string) => {
    if (renameInput.trim()) {
      renameCanvas(id, renameInput.trim());
    }
    setRenamingId(null);
  };

  const pastelColors = ['#EEEDFD', '#D0F8E3', '#D7E3FF', '#F5F0E6', '#FED7E8'];

  return (
    <div className="flex flex-col gap-1.5 pt-3 border-t border-border/60">
      <div className="flex items-center justify-between px-2">
        <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
          Canvas
        </span>
        <button
          onClick={handleCreateCanvas}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-surface text-primaryDark border border-border-hover shadow-2xs text-[10px] font-semibold transition-colors cursor-pointer"
          title="Create new canvas"
        >
          <Plus className="w-2.5 h-2.5" />
          <span>New canvas</span>
        </button>
      </div>

      <div className="bg-surface-warm/80 rounded-2xl p-1.5 border border-border/70 flex flex-col gap-1 max-h-44 overflow-y-auto">
        {canvases.map((c, index) => {
          const isCanvasActive = activeTab === 'canvas' && activeCanvasId === c.id;
          const bgTint = pastelColors[index % pastelColors.length];
          const dotColor = bgTint;

          return (
            <div
              key={c.id}
              onClick={() => {
                setActiveCanvasId(c.id);
                setActiveTab('canvas');
              }}
              style={{
                backgroundColor: isCanvasActive ? bgTint : 'transparent',
              }}
              className={cn(
                'group/canvas flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer select-none',
                isCanvasActive
                  ? 'text-primaryDark font-semibold shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: dotColor }}
                />
                {renamingId === c.id ? (
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(c.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => handleFinishRename(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white px-1 py-0.5 rounded text-xs outline-none w-24 border border-border"
                    autoFocus
                  />
                ) : (
                  <span className="truncate">{c.title}</span>
                )}
              </div>

              <div className="opacity-0 group-hover/canvas:opacity-100 flex items-center gap-0.5 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(c.id, c.title);
                  }}
                  className="p-1 hover:text-primaryDark text-secondaryGray/70 rounded cursor-pointer"
                  title="Rename"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                {canvases.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCanvas(c.id);
                    }}
                    className="p-1 hover:text-rose-600 text-secondaryGray/70 rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
