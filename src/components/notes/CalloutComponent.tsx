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
  iconColor: string;
  bg: string;
  border: string;
}

export const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  decision: {
    label: 'Decision Record',
    defaultEyebrow: 'DECISION RECORD · 04',
    icon: CheckCircle2,
    containerClass: 'bg-[#E8F8F0] border border-emerald-300/80 text-emerald-950',
    eyebrowClass: 'text-emerald-800',
    iconColor: 'text-emerald-700',
    bg: 'bg-[#E8F8F0]',
    border: 'border-emerald-300/80',
  },
  caution: {
    label: 'Caution',
    defaultEyebrow: 'CAUTION',
    icon: AlertTriangle,
    containerClass: 'bg-[#FEF3E8] border border-amber-300/80 text-amber-950',
    eyebrowClass: 'text-amber-800',
    iconColor: 'text-amber-700',
    bg: 'bg-[#FEF3E8]',
    border: 'border-amber-300/80',
  },
  idea: {
    label: 'Idea',
    defaultEyebrow: 'IDEA',
    icon: Lightbulb,
    containerClass: 'bg-[#F0EEFF] border border-indigo-300/80 text-indigo-950',
    eyebrowClass: 'text-indigo-800',
    iconColor: 'text-indigo-700',
    bg: 'bg-[#F0EEFF]',
    border: 'border-indigo-300/80',
  },
  reference: {
    label: 'Reference',
    defaultEyebrow: 'REFERENCE',
    icon: Bookmark,
    containerClass: 'bg-[#EBF6FE] border border-sky-300/80 text-sky-950',
    eyebrowClass: 'text-sky-800',
    iconColor: 'text-sky-700',
    bg: 'bg-[#EBF6FE]',
    border: 'border-sky-300/80',
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
            {/* Type Switcher Dropdown - Clean Icon Only */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-white/80 hover:bg-white border border-black/10 transition-colors cursor-pointer shadow-xs"
                title={config.label}
              >
                <IconComponent className={cn('w-3.5 h-3.5', config.iconColor)} />
                <ChevronDown className="w-2.5 h-2.5 opacity-60 text-primaryDark" />
              </button>

              {isTypeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsTypeMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-border shadow-float rounded-full p-1 z-30 flex items-center gap-1">
                    {(Object.keys(CALLOUT_CONFIGS) as CalloutType[]).map((t) => {
                      const c = CALLOUT_CONFIGS[t];
                      const ItemIcon = c.icon;
                      const isSelected = t === currentType;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTypeChange(t)}
                          title={c.label}
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-2xs',
                            c.bg,
                            c.border,
                            c.iconColor,
                            isSelected
                              ? 'ring-2 ring-primaryDark/60 scale-105'
                              : 'opacity-80 hover:opacity-100'
                          )}
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </>
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
