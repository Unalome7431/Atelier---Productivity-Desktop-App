import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalloutType = 'decision' | 'caution' | 'idea' | 'reference';

export interface CalloutConfig {
  label: string;
  defaultEyebrow: string;
  icon: React.ElementType;
  containerClass: string;
  eyebrowClass: string;
}

export const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  decision: {
    label: 'Decision Record',
    defaultEyebrow: 'DECISION RECORD · 04',
    icon: CheckCircle2,
    containerClass: 'bg-[#E8F8F0] border-emerald-200/90 text-emerald-950',
    eyebrowClass: 'text-emerald-800',
  },
  caution: {
    label: 'Caution',
    defaultEyebrow: 'CAUTION',
    icon: AlertTriangle,
    containerClass: 'bg-[#FEF3E8] border-amber-200/90 text-amber-950',
    eyebrowClass: 'text-amber-800',
  },
  idea: {
    label: 'Idea',
    defaultEyebrow: 'IDEA',
    icon: Lightbulb,
    containerClass: 'bg-[#F0EEFF] border-indigo-200/90 text-indigo-950',
    eyebrowClass: 'text-indigo-800',
  },
  reference: {
    label: 'Reference',
    defaultEyebrow: 'REFERENCE',
    icon: Bookmark,
    containerClass: 'bg-[#EBF6FE] border-sky-200/90 text-sky-950',
    eyebrowClass: 'text-sky-800',
  },
};

export const CalloutComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const currentType: CalloutType = (node.attrs.type as CalloutType) || 'decision';
  const config = CALLOUT_CONFIGS[currentType] || CALLOUT_CONFIGS.decision;
  const IconComponent = config.icon;

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

  const handleTypeChange = (newType: CalloutType) => {
    const newConfig = CALLOUT_CONFIGS[newType];
    updateAttributes({
      type: newType,
      eyebrow:
        node.attrs.eyebrow === config.defaultEyebrow
          ? newConfig.defaultEyebrow
          : node.attrs.eyebrow,
    });
    setIsTypeMenuOpen(false);
  };

  return (
    <NodeViewWrapper className="my-5 select-text">
      <div
        className={cn(
          'group/callout relative rounded-2xl p-5 border transition-all shadow-subtle',
          config.containerClass
        )}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2 select-none">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 shrink-0" />
            <input
              type="text"
              value={node.attrs.eyebrow || config.defaultEyebrow}
              onChange={(e) => updateAttributes({ eyebrow: e.target.value })}
              className={cn(
                'font-mono text-[10px] font-bold tracking-widest uppercase bg-transparent outline-none border-b border-transparent hover:border-black/20 focus:border-black/40 transition-colors',
                config.eyebrowClass
              )}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Type Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 hover:bg-white text-[10px] font-mono font-medium text-primaryDark border border-black/10 transition-colors cursor-pointer shadow-xs"
              >
                <span>{config.label}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {isTypeMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-border shadow-float rounded-xl p-1 z-30 flex flex-col gap-0.5">
                  {(Object.keys(CALLOUT_CONFIGS) as CalloutType[]).map((t) => {
                    const c = CALLOUT_CONFIGS[t];
                    const ItemIcon = c.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-sans text-left transition-colors cursor-pointer',
                          t === currentType
                            ? 'bg-surface font-semibold text-primaryDark'
                            : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
                        )}
                      >
                        <ItemIcon className="w-3.5 h-3.5" />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delete Callout */}
            <button
              type="button"
              onClick={deleteNode}
              title="Delete callout block"
              className="opacity-0 group-hover/callout:opacity-100 p-1 rounded-full text-secondaryGray hover:text-rose-600 hover:bg-white/60 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Callout Title Input */}
        <div className="mb-2">
          <input
            type="text"
            value={node.attrs.title || ''}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="Callout title or thesis statement..."
            className="w-full font-display font-bold text-[17px] text-primaryDark placeholder:text-secondaryGray/40 bg-transparent outline-none tracking-tight"
          />
        </div>

        {/* Callout Content Area */}
        <NodeViewContent className="callout-body font-sans text-ui-rg-sm text-secondaryGray leading-relaxed" />
      </div>
    </NodeViewWrapper>
  );
};
