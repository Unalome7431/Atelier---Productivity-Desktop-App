/**
 * Tag styling and color palettes matching STYLEGUIDE.md
 * (Aura UI × Soft Minimalism × Pastel Productivity)
 * Strictly zero emojis and zero arbitrary hashtags.
 */

export interface DomainTagOption {
  label: string;
  color?: string; // e.g. 'mint' | 'lavender' | 'lilac' | 'blue' | 'butter' | 'pink' | 'mauve' | 'sand'
}

export const PASTEL_TAG_COLORS: Record<
  string,
  { name: string; bg: string; text: string; border: string; preview: string }
> = {
  mint: {
    name: 'Mint',
    bg: 'bg-pastel-mint-bg',
    text: 'text-pastel-mint-text',
    border: 'border-pastel-mint-border',
    preview: '#34D399',
  },
  lavender: {
    name: 'Lavender',
    bg: 'bg-pastel-lavender-bg',
    text: 'text-pastel-lavender-text',
    border: 'border-pastel-lavender-border',
    preview: '#818CF8',
  },
  lilac: {
    name: 'Lilac',
    bg: 'bg-pastel-lilac-bg',
    text: 'text-pastel-lilac-text',
    border: 'border-pastel-lilac-border',
    preview: '#C084FC',
  },
  blue: {
    name: 'Sky Blue',
    bg: 'bg-pastel-blue-bg',
    text: 'text-pastel-blue-text',
    border: 'border-pastel-blue-border',
    preview: '#60A5FA',
  },
  butter: {
    name: 'Butter',
    bg: 'bg-pastel-butter-bg',
    text: 'text-pastel-butter-text',
    border: 'border-pastel-butter-border',
    preview: '#FBBF24',
  },
  pink: {
    name: 'Rose Pink',
    bg: 'bg-pastel-pink-bg',
    text: 'text-pastel-pink-text',
    border: 'border-pastel-pink-border',
    preview: '#F472B6',
  },
  mauve: {
    name: 'Mauve',
    bg: 'bg-pastel-mauve-bg',
    text: 'text-pastel-mauve-text',
    border: 'border-pastel-mauve-border',
    preview: '#8E677E',
  },
  sand: {
    name: 'Sand',
    bg: 'bg-pastel-sand-bg',
    text: 'text-pastel-sand-text',
    border: 'border-pastel-sand-border',
    preview: '#D4C5A9',
  },
};

const COLOR_KEYS = Object.keys(PASTEL_TAG_COLORS);

/**
 * Returns consistent Tailwind CSS classes for a given tag label and optional color name.
 * If color name is omitted or unknown, derives a deterministic pastel palette from tag label string hash.
 */
export function getTagStyle(tag?: string, colorName?: string): string {
  if (!tag) return 'bg-surface text-secondaryGray border-border';

  if (colorName && PASTEL_TAG_COLORS[colorName.toLowerCase()]) {
    const pal = PASTEL_TAG_COLORS[colorName.toLowerCase()];
    return `${pal.bg} ${pal.text} ${pal.border}`;
  }

  // Fallback to keyword matching for common terminology
  const lower = tag.toLowerCase();
  if (lower.includes('doc') || lower.includes('contract')) {
    return 'bg-pastel-mint-bg text-pastel-mint-text border-pastel-mint-border';
  }
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
    return 'bg-pastel-lavender-bg text-pastel-lavender-text border-pastel-lavender-border';
  }
  if (
    lower.includes('eng') ||
    lower.includes('code') ||
    lower.includes('backend') ||
    lower.includes('infra')
  ) {
    return 'bg-pastel-mint-bg text-pastel-mint-text border-pastel-mint-border';
  }
  if (lower.includes('research') || lower.includes('interview')) {
    return 'bg-pastel-lilac-bg text-pastel-lilac-text border-pastel-lilac-border';
  }
  if (lower.includes('qa') || lower.includes('test') || lower.includes('sec')) {
    return 'bg-pastel-blue-bg text-pastel-blue-text border-pastel-blue-border';
  }
  if (lower.includes('content') || lower.includes('copy') || lower.includes('market')) {
    return 'bg-pastel-butter-bg text-pastel-butter-text border-pastel-butter-border';
  }

  // Deterministic hash so user-created custom tags get a stable, beautiful pastel color
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  const key = COLOR_KEYS[Math.abs(hash) % COLOR_KEYS.length];
  const pal = PASTEL_TAG_COLORS[key];
  return `${pal.bg} ${pal.text} ${pal.border}`;
}

export interface ColumnThemeOption {
  id: string;
  name: string;
  bgTint: string;
  borderClass: string;
  dotColor: string;
  colorAccent: string;
  previewColor: string;
}

export const COLUMN_THEMES: ColumnThemeOption[] = [
  {
    id: 'sand',
    name: 'Warm Sand',
    bgTint: 'bg-pastel-sand-tint',
    borderClass: 'border-pastel-sand-border',
    dotColor: '#D4C5A9',
    colorAccent: '#FCFCE8',
    previewColor: '#D4C5A9',
  },
  {
    id: 'blue',
    name: 'Soft Blue',
    bgTint: 'bg-pastel-lavender-tint',
    borderClass: 'border-pastel-lavender-border',
    dotColor: '#818CF8',
    colorAccent: '#EBE7FF',
    previewColor: '#818CF8',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    bgTint: 'bg-pastel-lilac-tint',
    borderClass: 'border-pastel-lilac-border',
    dotColor: '#C084FC',
    colorAccent: '#EBE9FE',
    previewColor: '#C084FC',
  },
  {
    id: 'mint',
    name: 'Mint Green',
    bgTint: 'bg-pastel-mint-tint',
    borderClass: 'border-pastel-mint-border',
    dotColor: '#34D399',
    colorAccent: '#D1FAE5',
    previewColor: '#34D399',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    bgTint: 'bg-pastel-pink-tint',
    borderClass: 'border-pastel-pink-border',
    dotColor: '#F43F5E',
    colorAccent: '#FFE4E6',
    previewColor: '#F43F5E',
  },
  {
    id: 'butter',
    name: 'Butter Yellow',
    bgTint: 'bg-pastel-butter-tint',
    borderClass: 'border-pastel-butter-border',
    dotColor: '#EAB308',
    colorAccent: '#FEF9C3',
    previewColor: '#EAB308',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    bgTint: 'bg-pastel-blue-tint',
    borderClass: 'border-pastel-blue-border',
    dotColor: '#0EA5E9',
    colorAccent: '#BAE6FD',
    previewColor: '#0EA5E9',
  },
  {
    id: 'parchment',
    name: 'Neutral Parchment',
    bgTint: 'bg-surface',
    borderClass: 'border-border',
    dotColor: '#787571',
    colorAccent: '#FAF8F5',
    previewColor: '#787571',
  },
];
