import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Maximize2, ZoomIn, ZoomOut, Grid, Edit2, Check, Maximize, Minimize } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { cn } from '@/lib/utils';

export const CanvasHeader: React.FC = () => {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const {
    canvases,
    activeCanvasId,
    gridEnabled,
    setGridEnabled,
    renameCanvas,
    isFullscreen,
    setIsFullscreen,
  } = useCanvasStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId) || canvases[0];
  const [titleInput, setTitleInput] = useState(activeCanvas?.title || 'Canvas');

  // Sync title when active canvas changes
  React.useEffect(() => {
    if (activeCanvas) {
      setTitleInput(activeCanvas.title);
    }
  }, [activeCanvas]);

  const handleSaveTitle = () => {
    if (!activeCanvas) return;
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      renameCanvas(activeCanvas.id, titleInput.trim());
    }
  };

  const handleFitBoard = () => {
    fitView({ padding: 0.18, duration: 450 });
  };

  const currentZoomPercent = Math.round((getZoom ? getZoom() : 1) * 100);

  return (
    <div className="absolute top-4 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
      {/* Left Canvas Title Container */}
      <div className="pointer-events-auto flex items-center gap-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-border shadow-subtle">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="font-display font-bold text-lg text-primaryDark outline-none bg-transparent w-44"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 rounded-full bg-primaryDark text-bg hover:opacity-90 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-2 cursor-pointer select-none"
          >
            <h2 className="font-display font-bold text-2xl tracking-tight text-primaryDark">
              {activeCanvas?.title || 'Canvas A'}
            </h2>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="opacity-0 group-hover:opacity-100 p-1 text-secondaryGray hover:text-primaryDark transition-opacity cursor-pointer"
              title="Rename canvas"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Canvas Controls */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {/* Fit Board Button */}
        <button
          onClick={handleFitBoard}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-primaryDark border border-border shadow-subtle font-sans text-xs font-semibold hover:shadow-float transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-secondaryGray" />
          <span>Fit board</span>
        </button>

        {/* Zoom Controls & Level Badge */}
        <div className="bg-white/95 border border-border px-2 py-1 rounded-full shadow-subtle flex items-center gap-1">
          <button
            onClick={() => zoomOut({ duration: 250 })}
            title="Zoom Out"
            className="p-1 text-secondaryGray hover:text-primaryDark hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold text-secondaryGray px-1 min-w-[38px] text-center select-none">
            {currentZoomPercent}%
          </span>
          <button
            onClick={() => zoomIn({ duration: 250 })}
            title="Zoom In"
            className="p-1 text-secondaryGray hover:text-primaryDark hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dot Grid Toggle */}
        <button
          onClick={() => setGridEnabled(!gridEnabled)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-subtle font-sans text-xs font-semibold transition-all cursor-pointer select-none',
            gridEnabled
              ? 'bg-accent-indigo text-primaryDark border-accent-indigo/60'
              : 'bg-white/95 text-secondaryGray border-border hover:text-primaryDark'
          )}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid: {gridEnabled ? 'On' : 'Off'}</span>
        </button>

        {/* Fullscreen Canvas Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Canvas'}
          className="p-2 rounded-full bg-white/95 hover:bg-white text-secondaryGray hover:text-primaryDark border border-border shadow-subtle transition-all cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
