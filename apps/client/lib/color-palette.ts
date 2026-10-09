import { PALETTE_COLORS, type PaletteColor } from '@todo/shared';

export interface ColorPaletteConfig {
  key: PaletteColor;
  label: string;
  hex: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
  dotClass: string;
}

export const COLOR_PALETTE_CONFIG: Record<PaletteColor, ColorPaletteConfig> = {
  slate: {
    key: 'slate',
    label: 'Slate',
    hex: '#64748B',
    badgeBgClass: 'bg-slate-100 dark:bg-slate-900/60',
    badgeTextClass: 'text-slate-700 dark:text-slate-300',
    badgeBorderClass: 'border-slate-200 dark:border-slate-800',
    dotClass: 'bg-slate-500',
  },
  gray: {
    key: 'gray',
    label: 'Gray',
    hex: '#6B7280',
    badgeBgClass: 'bg-gray-100 dark:bg-gray-900/60',
    badgeTextClass: 'text-gray-700 dark:text-gray-300',
    badgeBorderClass: 'border-gray-200 dark:border-gray-800',
    dotClass: 'bg-gray-500',
  },
  red: {
    key: 'red',
    label: 'Red',
    hex: '#EF4444',
    badgeBgClass: 'bg-red-100 dark:bg-red-950/60',
    badgeTextClass: 'text-red-700 dark:text-red-300',
    badgeBorderClass: 'border-red-200 dark:border-red-800',
    dotClass: 'bg-red-500',
  },
  orange: {
    key: 'orange',
    label: 'Orange',
    hex: '#F97316',
    badgeBgClass: 'bg-orange-100 dark:bg-orange-950/60',
    badgeTextClass: 'text-orange-700 dark:text-orange-300',
    badgeBorderClass: 'border-orange-200 dark:border-orange-800',
    dotClass: 'bg-orange-500',
  },
  amber: {
    key: 'amber',
    label: 'Amber',
    hex: '#F59E0B',
    badgeBgClass: 'bg-amber-100 dark:bg-amber-950/60',
    badgeTextClass: 'text-amber-700 dark:text-amber-300',
    badgeBorderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  yellow: {
    key: 'yellow',
    label: 'Yellow',
    hex: '#EAB308',
    badgeBgClass: 'bg-yellow-100 dark:bg-yellow-950/60',
    badgeTextClass: 'text-yellow-800 dark:text-yellow-300',
    badgeBorderClass: 'border-yellow-200 dark:border-yellow-800',
    dotClass: 'bg-yellow-500',
  },
  lime: {
    key: 'lime',
    label: 'Lime',
    hex: '#84CC16',
    badgeBgClass: 'bg-lime-100 dark:bg-lime-950/60',
    badgeTextClass: 'text-lime-800 dark:text-lime-300',
    badgeBorderClass: 'border-lime-200 dark:border-lime-800',
    dotClass: 'bg-lime-500',
  },
  green: {
    key: 'green',
    label: 'Green',
    hex: '#22C55E',
    badgeBgClass: 'bg-green-100 dark:bg-green-950/60',
    badgeTextClass: 'text-green-700 dark:text-green-300',
    badgeBorderClass: 'border-green-200 dark:border-green-800',
    dotClass: 'bg-green-500',
  },
  emerald: {
    key: 'emerald',
    label: 'Emerald',
    hex: '#10B981',
    badgeBgClass: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-300',
    badgeBorderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  teal: {
    key: 'teal',
    label: 'Teal',
    hex: '#14B8A6',
    badgeBgClass: 'bg-teal-100 dark:bg-teal-950/60',
    badgeTextClass: 'text-teal-700 dark:text-teal-300',
    badgeBorderClass: 'border-teal-200 dark:border-teal-800',
    dotClass: 'bg-teal-500',
  },
  cyan: {
    key: 'cyan',
    label: 'Cyan',
    hex: '#06B6D4',
    badgeBgClass: 'bg-cyan-100 dark:bg-cyan-950/60',
    badgeTextClass: 'text-cyan-700 dark:text-cyan-300',
    badgeBorderClass: 'border-cyan-200 dark:border-cyan-800',
    dotClass: 'bg-cyan-500',
  },
  sky: {
    key: 'sky',
    label: 'Sky Blue',
    hex: '#0EA5E9',
    badgeBgClass: 'bg-sky-100 dark:bg-sky-950/60',
    badgeTextClass: 'text-sky-700 dark:text-sky-300',
    badgeBorderClass: 'border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  },
  blue: {
    key: 'blue',
    label: 'Blue',
    hex: '#3B82F6',
    badgeBgClass: 'bg-blue-100 dark:bg-blue-950/60',
    badgeTextClass: 'text-blue-700 dark:text-blue-300',
    badgeBorderClass: 'border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-500',
  },
  indigo: {
    key: 'indigo',
    label: 'Indigo',
    hex: '#6366F1',
    badgeBgClass: 'bg-indigo-100 dark:bg-indigo-950/60',
    badgeTextClass: 'text-indigo-700 dark:text-indigo-300',
    badgeBorderClass: 'border-indigo-200 dark:border-indigo-800',
    dotClass: 'bg-indigo-500',
  },
  violet: {
    key: 'violet',
    label: 'Violet',
    hex: '#8B5CF6',
    badgeBgClass: 'bg-violet-100 dark:bg-violet-950/60',
    badgeTextClass: 'text-violet-700 dark:text-violet-300',
    badgeBorderClass: 'border-violet-200 dark:border-violet-800',
    dotClass: 'bg-violet-500',
  },
  purple: {
    key: 'purple',
    label: 'Purple',
    hex: '#A855F7',
    badgeBgClass: 'bg-purple-100 dark:bg-purple-950/60',
    badgeTextClass: 'text-purple-700 dark:text-purple-300',
    badgeBorderClass: 'border-purple-200 dark:border-purple-800',
    dotClass: 'bg-purple-500',
  },
  fuchsia: {
    key: 'fuchsia',
    label: 'Fuchsia',
    hex: '#D946EF',
    badgeBgClass: 'bg-fuchsia-100 dark:bg-fuchsia-950/60',
    badgeTextClass: 'text-fuchsia-700 dark:text-fuchsia-300',
    badgeBorderClass: 'border-fuchsia-200 dark:border-fuchsia-800',
    dotClass: 'bg-fuchsia-500',
  },
  pink: {
    key: 'pink',
    label: 'Pink',
    hex: '#EC4899',
    badgeBgClass: 'bg-pink-100 dark:bg-pink-950/60',
    badgeTextClass: 'text-pink-700 dark:text-pink-300',
    badgeBorderClass: 'border-pink-200 dark:border-pink-800',
    dotClass: 'bg-pink-500',
  },
  rose: {
    key: 'rose',
    label: 'Rose',
    hex: '#F43F5E',
    badgeBgClass: 'bg-rose-100 dark:bg-rose-950/60',
    badgeTextClass: 'text-rose-700 dark:text-rose-300',
    badgeBorderClass: 'border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
};

export function getColorConfig(key?: string | null): ColorPaletteConfig {
  if (key && key in COLOR_PALETTE_CONFIG) {
    return COLOR_PALETTE_CONFIG[key as PaletteColor];
  }
  return COLOR_PALETTE_CONFIG.slate;
}
