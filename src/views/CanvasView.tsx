import React from 'react';
import { Layers, Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const CanvasView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#F6F4F0] relative overflow-hidden">
      {/* Canvas Controls Header */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
        <div className="bg-surface/90 border border-border px-4 py-2 rounded-pill shadow-subtle flex items-center gap-3">
          <span className="font-display font-bold text-display-6 text-primaryDark">
            Spatial Concept Canvas
          </span>
          <Badge variant="mint">v0.1 Ready</Badge>
        </div>
      </div>

      <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
        <div className="bg-surface/90 border border-border p-1 rounded-pill shadow-subtle flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="primary" size="sm" className="gap-1.5 shadow-subtle">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Node</span>
        </Button>
      </div>

      {/* Spatial Dot Grid Background */}
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#787571_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="z-10 text-center flex flex-col items-center gap-3 max-w-md p-6 bg-surface/90 rounded-panel border border-border shadow-float">
          <div className="w-12 h-12 rounded-full bg-accent-purple flex items-center justify-center text-primaryDark">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-display-3 text-primaryDark">
            Infinite Spatial Canvas
          </h3>
          <p className="text-ui-rg-sm text-secondaryGray">
            Spatial node graphing powered by <span className="font-mono text-mono-md font-semibold text-primaryDark">@xyflow/react</span>. Connect concept notes, cards, and architecture diagrams.
          </p>
        </div>
      </div>
    </div>
  );
};
