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
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#065F46]',
    border: 'border-[#A7F3D0]',
    preview: '#34D399',
  },
  lavender: {
    name: 'Lavender',
    bg: 'bg-[#EBE7FF]',
    text: 'text-[#4338CA]',
    border: 'border-[#D5CEF5]',
    preview: '#818CF8',
  },
  lilac: {
    name: 'Lilac',
    bg: 'bg-[#EBE9FE]',
    text: 'text-[#6D28D9]',
    border: 'border-[#DDD6FE]',
    preview: '#C084FC',
  },
  blue: {
    name: 'Sky Blue',
    bg: 'bg-[#BAE6FD]',
    text: 'text-[#0369A1]',
    border: 'border-[#7DD3FC]',
    preview: '#60A5FA',
  },
  butter: {
    name: 'Butter',
    bg: 'bg-[#FCFCE8]',
    text: 'text-[#854D0E]',
    border: 'border-[#FEF08A]',
    preview: '#FBBF24',
  },
  pink: {
    name: 'Rose Pink',
    bg: 'bg-[#FFE4E6]',
    text: 'text-[#9F1239]',
    border: 'border-[#FECDD3]',
    preview: '#F472B6',
  },
  mauve: {
    name: 'Mauve',
    bg: 'bg-[#F3E8EE]',
    text: 'text-[#8E677E]',
    border: 'border-[#E5D5DF]',
    preview: '#8E677E',
  },
  sand: {
    name: 'Sand',
    bg: 'bg-[#FAF7F0]',
    text: 'text-[#787571]',
    border: 'border-[#E8E2D5]',
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
    return 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'; // mint
  }
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
    return 'bg-[#EBE7FF] text-[#4338CA] border-[#D5CEF5]'; // lavender
  }
  if (
    lower.includes('eng') ||
    lower.includes('code') ||
    lower.includes('backend') ||
    lower.includes('infra')
  ) {
    return 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]'; // mint
  }
  if (lower.includes('research') || lower.includes('interview')) {
    return 'bg-[#EBE9FE] text-[#6D28D9] border-[#DDD6FE]'; // lilac
  }
  if (lower.includes('qa') || lower.includes('test') || lower.includes('sec')) {
    return 'bg-[#BAE6FD] text-[#0369A1] border-[#7DD3FC]'; // sky blue
  }
  if (lower.includes('content') || lower.includes('copy') || lower.includes('market')) {
    return 'bg-[#FCFCE8] text-[#854D0E] border-[#FEF08A]'; // butter
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
    bgTint: 'bg-[#FAF7F0]',
    borderClass: 'border-[#E8E2D5]',
    dotColor: '#D4C5A9',
    colorAccent: '#FCFCE8',
    previewColor: '#D4C5A9',
  },
  {
    id: 'blue',
    name: 'Soft Blue',
    bgTint: 'bg-[#F0F3FF]',
    borderClass: 'border-[#DCE4FF]',
    dotColor: '#818CF8',
    colorAccent: '#EBE7FF',
    previewColor: '#818CF8',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    bgTint: 'bg-[#F5F0FF]',
    borderClass: 'border-[#E7DBFF]',
    dotColor: '#C084FC',
    colorAccent: '#EBE9FE',
    previewColor: '#C084FC',
  },
  {
    id: 'mint',
    name: 'Mint Green',
    bgTint: 'bg-[#ECFDF5]',
    borderClass: 'border-[#D1F2E2]',
    dotColor: '#34D399',
    colorAccent: '#D1FAE5',
    previewColor: '#34D399',
  },
  {
    id: 'pink',
    name: 'Rose Pink',
    bgTint: 'bg-[#FFF1F2]',
    borderClass: 'border-[#FFE4E6]',
    dotColor: '#F43F5E',
    colorAccent: '#FFE4E6',
    previewColor: '#F43F5E',
  },
  {
    id: 'butter',
    name: 'Butter Yellow',
    bgTint: 'bg-[#FEFCE8]',
    borderClass: 'border-[#FEF08A]',
    dotColor: '#EAB308',
    colorAccent: '#FEF9C3',
    previewColor: '#EAB308',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    bgTint: 'bg-[#F0F9FF]',
    borderClass: 'border-[#E0F2FE]',
    dotColor: '#0EA5E9',
    colorAccent: '#BAE6FD',
    previewColor: '#0EA5E9',
  },
  {
    id: 'parchment',
    name: 'Neutral Parchment',
    bgTint: 'bg-[#F5F1E8]',
    borderClass: 'border-[#EFEAE1]',
    dotColor: '#787571',
    colorAccent: '#FAF8F5',
    previewColor: '#787571',
  },
];
