import React from 'react';
import {
  Droplets,
  Code,
  Activity,
  BookOpen,
  PenTool,
  Coffee,
  Flame,
  Sparkles,
  Target,
  Zap,
  Dumbbell,
  CheckCircle2,
  Heart,
  Smile,
  LucideIcon,
} from 'lucide-react';

export interface RoutineIconOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const ROUTINE_ICON_OPTIONS: RoutineIconOption[] = [
  { id: 'droplets', label: 'Hydration', icon: Droplets },
  { id: 'code', label: 'Development', icon: Code },
  { id: 'activity', label: 'Movement', icon: Activity },
  { id: 'book-open', label: 'Reading', icon: BookOpen },
  { id: 'pen-tool', label: 'Writing', icon: PenTool },
  { id: 'coffee', label: 'Break', icon: Coffee },
  { id: 'flame', label: 'Workout', icon: Flame },
  { id: 'sparkles', label: 'Reflection', icon: Sparkles },
  { id: 'target', label: 'Focus', icon: Target },
  { id: 'zap', label: 'Energy', icon: Zap },
  { id: 'dumbbell', label: 'Training', icon: Dumbbell },
  { id: 'check-circle', label: 'Discipline', icon: CheckCircle2 },
  { id: 'heart', label: 'Wellness', icon: Heart },
  { id: 'smile', label: 'Mindset', icon: Smile },
];

const ICON_MAP: Record<string, LucideIcon> = ROUTINE_ICON_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.id] = opt.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

interface RoutineIconProps {
  iconId?: string;
  className?: string;
}

export const RoutineIcon: React.FC<RoutineIconProps> = ({
  iconId = 'droplets',
  className = 'w-4 h-4',
}) => {
  // Legacy emoji fallback mapping to keep older database records visual without displaying raw emojis
  let mappedId = iconId;
  if (iconId === '\u{1F4A7}') mappedId = 'droplets';
  else if (iconId === '\u{1F4BB}') mappedId = 'code';
  else if (iconId === '\u{1F9D8}') mappedId = 'activity';
  else if (iconId === '\u{1F4D6}') mappedId = 'book-open';
  else if (iconId.startsWith('\u{270D}')) mappedId = 'pen-tool';
  else if (iconId === '\u{2615}') mappedId = 'coffee';
  else if (iconId === '\u{1F3C3}') mappedId = 'dumbbell';
  else if (iconId === '\u{1F33F}') mappedId = 'heart';
  else if (iconId === '\u{1F3AF}') mappedId = 'target';
  else if (iconId === '\u{26A1}') mappedId = 'zap';
  else if (iconId === '\u{1F3A8}') mappedId = 'sparkles';

  const IconComponent = ICON_MAP[mappedId] || Activity;
  return <IconComponent className={className} />;
};
