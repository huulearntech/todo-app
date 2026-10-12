import { type PaletteColor } from '@todo/shared';

export interface ColorPaletteConfig {
  key: PaletteColor;
  label: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
  dotClass: string;
}

export const COLOR_PALETTE_CONFIG: Record<PaletteColor, ColorPaletteConfig> = {
  slate: {
    key: 'slate',
    label: 'Slate',
    badgeBgClass: 'bg-slate-600/15 dark:bg-slate-400/20',
    badgeTextClass: 'text-slate-600 dark:text-slate-400',
    badgeBorderClass: 'border-slate-600/30 dark:border-slate-400/30',
    dotClass: 'bg-slate-600 dark:bg-slate-400',
  },
  gray: {
    key: 'gray',
    label: 'Gray',
    badgeBgClass: 'bg-gray-600/15 dark:bg-gray-400/20',
    badgeTextClass: 'text-gray-600 dark:text-gray-400',
    badgeBorderClass: 'border-gray-600/30 dark:border-gray-400/30',
    dotClass: 'bg-gray-600 dark:bg-gray-400',
  },
  red: {
    key: 'red',
    label: 'Red',
    badgeBgClass: 'bg-red-600/15 dark:bg-red-400/20',
    badgeTextClass: 'text-red-600 dark:text-red-400',
    badgeBorderClass: 'border-red-600/30 dark:border-red-400/30',
    dotClass: 'bg-red-600 dark:bg-red-400',
  },
  orange: {
    key: 'orange',
    label: 'Orange',
    badgeBgClass: 'bg-orange-600/15 dark:bg-orange-400/20',
    badgeTextClass: 'text-orange-600 dark:text-orange-400',
    badgeBorderClass: 'border-orange-600/30 dark:border-orange-400/30',
    dotClass: 'bg-orange-600 dark:bg-orange-400',
  },
  amber: {
    key: 'amber',
    label: 'Amber',
    badgeBgClass: 'bg-amber-600/15 dark:bg-amber-400/20',
    badgeTextClass: 'text-amber-600 dark:text-amber-400',
    badgeBorderClass: 'border-amber-600/30 dark:border-amber-400/30',
    dotClass: 'bg-amber-600 dark:bg-amber-400',
  },
  yellow: {
    key: 'yellow',
    label: 'Yellow',
    badgeBgClass: 'bg-yellow-600/15 dark:bg-yellow-400/20',
    badgeTextClass: 'text-yellow-600 dark:text-yellow-400',
    badgeBorderClass: 'border-yellow-600/30 dark:border-yellow-400/30',
    dotClass: 'bg-yellow-600 dark:bg-yellow-400',
  },
  lime: {
    key: 'lime',
    label: 'Lime',
    badgeBgClass: 'bg-lime-600/15 dark:bg-lime-400/20',
    badgeTextClass: 'text-lime-600 dark:text-lime-400',
    badgeBorderClass: 'border-lime-600/30 dark:border-lime-400/30',
    dotClass: 'bg-lime-600 dark:bg-lime-400',
  },
  green: {
    key: 'green',
    label: 'Green',
    badgeBgClass: 'bg-green-600/15 dark:bg-green-400/20',
    badgeTextClass: 'text-green-600 dark:text-green-400',
    badgeBorderClass: 'border-green-600/30 dark:border-green-400/30',
    dotClass: 'bg-green-600 dark:bg-green-400',
  },
  emerald: {
    key: 'emerald',
    label: 'Emerald',
    badgeBgClass: 'bg-emerald-600/15 dark:bg-emerald-400/20',
    badgeTextClass: 'text-emerald-600 dark:text-emerald-400',
    badgeBorderClass: 'border-emerald-600/30 dark:border-emerald-400/30',
    dotClass: 'bg-emerald-600 dark:bg-emerald-400',
  },
  teal: {
    key: 'teal',
    label: 'Teal',
    badgeBgClass: 'bg-teal-600/15 dark:bg-teal-400/20',
    badgeTextClass: 'text-teal-600 dark:text-teal-400',
    badgeBorderClass: 'border-teal-600/30 dark:border-teal-400/30',
    dotClass: 'bg-teal-600 dark:bg-teal-400',
  },
  cyan: {
    key: 'cyan',
    label: 'Cyan',
    badgeBgClass: 'bg-cyan-600/15 dark:bg-cyan-400/20',
    badgeTextClass: 'text-cyan-600 dark:text-cyan-400',
    badgeBorderClass: 'border-cyan-600/30 dark:border-cyan-400/30',
    dotClass: 'bg-cyan-600 dark:bg-cyan-400',
  },
  sky: {
    key: 'sky',
    label: 'Sky Blue',
    badgeBgClass: 'bg-sky-600/15 dark:bg-sky-400/20',
    badgeTextClass: 'text-sky-600 dark:text-sky-400',
    badgeBorderClass: 'border-sky-600/30 dark:border-sky-400/30',
    dotClass: 'bg-sky-600 dark:bg-sky-400',
  },
  blue: {
    key: 'blue',
    label: 'Blue',
    badgeBgClass: 'bg-blue-600/15 dark:bg-blue-400/20',
    badgeTextClass: 'text-blue-600 dark:text-blue-400',
    badgeBorderClass: 'border-blue-600/30 dark:border-blue-400/30',
    dotClass: 'bg-blue-600 dark:bg-blue-400',
  },
  indigo: {
    key: 'indigo',
    label: 'Indigo',
    badgeBgClass: 'bg-indigo-600/15 dark:bg-indigo-400/20',
    badgeTextClass: 'text-indigo-600 dark:text-indigo-400',
    badgeBorderClass: 'border-indigo-600/30 dark:border-indigo-400/30',
    dotClass: 'bg-indigo-600 dark:bg-indigo-400',
  },
  violet: {
    key: 'violet',
    label: 'Violet',
    badgeBgClass: 'bg-violet-600/15 dark:bg-violet-400/20',
    badgeTextClass: 'text-violet-600 dark:text-violet-400',
    badgeBorderClass: 'border-violet-600/30 dark:border-violet-400/30',
    dotClass: 'bg-violet-600 dark:bg-violet-400',
  },
  purple: {
    key: 'purple',
    label: 'Purple',
    badgeBgClass: 'bg-purple-600/15 dark:bg-purple-400/20',
    badgeTextClass: 'text-purple-600 dark:text-purple-400',
    badgeBorderClass: 'border-purple-600/30 dark:border-purple-400/30',
    dotClass: 'bg-purple-600 dark:bg-purple-400',
  },
  fuchsia: {
    key: 'fuchsia',
    label: 'Fuchsia',
    badgeBgClass: 'bg-fuchsia-600/15 dark:bg-fuchsia-400/20',
    badgeTextClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    badgeBorderClass: 'border-fuchsia-600/30 dark:border-fuchsia-400/30',
    dotClass: 'bg-fuchsia-600 dark:bg-fuchsia-400',
  },
  pink: {
    key: 'pink',
    label: 'Pink',
    badgeBgClass: 'bg-pink-600/15 dark:bg-pink-400/20',
    badgeTextClass: 'text-pink-600 dark:text-pink-400',
    badgeBorderClass: 'border-pink-600/30 dark:border-pink-400/30',
    dotClass: 'bg-pink-600 dark:bg-pink-400',
  },
  rose: {
    key: 'rose',
    label: 'Rose',
    badgeBgClass: 'bg-rose-600/15 dark:bg-rose-400/20',
    badgeTextClass: 'text-rose-600 dark:text-rose-400',
    badgeBorderClass: 'border-rose-600/30 dark:border-rose-400/30',
    dotClass: 'bg-rose-600 dark:bg-rose-400',
  },
};

export function getColorConfig(key?: string | null): ColorPaletteConfig {
  if (key && key in COLOR_PALETTE_CONFIG) {
    return COLOR_PALETTE_CONFIG[key as PaletteColor];
  }
  return COLOR_PALETTE_CONFIG.slate;
}
