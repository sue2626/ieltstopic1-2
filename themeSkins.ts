export type ThemeSkinId = 'lavender' | 'sakura' | 'matcha' | 'ocean' | 'honey' | 'emerald';

export interface ThemeSkin {
  id: ThemeSkinId;
  name: string;
  nameVi: string;
  emoji: string;
  colorHex: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  activeBorder: string;
  badgeBg: string;
  badgeText: string;
  accentBg: string;
  softBg: string;
  darkSoftBg: string;
  bannerGradient: string;
  pageBgLight: string;
  pageBgDark: string;
  surfaceBgDark: string;
  surfaceSoftDark: string;
  borderDark: string;
  accentLight: string;
  accentDark: string;
}

export const THEME_SKINS: ThemeSkin[] = [
  {
    id: 'lavender',
    name: 'Dusk Lavender',
    nameVi: 'Tím Khói Pastel',
    emoji: '💜',
    colorHex: '#9b87f5',
    primaryBg: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-600',
    primaryText: 'text-purple-600 dark:text-purple-300',
    activeBorder: 'border-purple-500 dark:border-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-800 dark:text-purple-200',
    accentBg: 'bg-purple-50 dark:bg-purple-950/40',
    softBg: 'bg-purple-50/70',
    darkSoftBg: 'dark:bg-purple-950/30',
    bannerGradient: 'from-purple-500 via-indigo-500 to-purple-600',
    pageBgLight: '#f4effa',
    pageBgDark: '#231f33',
    surfaceBgDark: '#2d2841',
    surfaceSoftDark: '#37314f',
    borderDark: '#4a4368',
    accentLight: '#ddd6fe',
    accentDark: '#4c3f73',
  },
  {
    id: 'sakura',
    name: 'Dusty Sakura',
    nameVi: 'Hồng Khói Pastel',
    emoji: '🌸',
    colorHex: '#e8829a',
    primaryBg: 'bg-rose-500',
    primaryHover: 'hover:bg-rose-600',
    primaryText: 'text-rose-600 dark:text-rose-300',
    activeBorder: 'border-rose-500 dark:border-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    badgeText: 'text-rose-800 dark:text-rose-200',
    accentBg: 'bg-rose-50 dark:bg-rose-950/40',
    softBg: 'bg-rose-50/70',
    darkSoftBg: 'dark:bg-rose-950/30',
    bannerGradient: 'from-rose-400 via-pink-400 to-rose-500',
    pageBgLight: '#faeff3',
    pageBgDark: '#2b212a',
    surfaceBgDark: '#362a35',
    surfaceSoftDark: '#423441',
    borderDark: '#584456',
    accentLight: '#fecdd3',
    accentDark: '#6b4255',
  },
  {
    id: 'matcha',
    name: 'Dusty Matcha',
    nameVi: 'Bạc Hà Khói Pastel',
    emoji: '🍵',
    colorHex: '#6bc497',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-700 dark:text-emerald-300',
    activeBorder: 'border-emerald-600 dark:border-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    softBg: 'bg-emerald-50/70',
    darkSoftBg: 'dark:bg-emerald-950/30',
    bannerGradient: 'from-emerald-500 via-teal-500 to-green-600',
    pageBgLight: '#eef6f1',
    pageBgDark: '#1e2926',
    surfaceBgDark: '#273531',
    surfaceSoftDark: '#31423d',
    borderDark: '#435952',
    accentLight: '#bbf7d0',
    accentDark: '#35594b',
  },
  {
    id: 'ocean',
    name: 'Twilight Periwinkle',
    nameVi: 'Xanh Đêm Pastel',
    emoji: '🌊',
    colorHex: '#78b0ec',
    primaryBg: 'bg-sky-600',
    primaryHover: 'hover:bg-sky-700',
    primaryText: 'text-sky-700 dark:text-sky-300',
    activeBorder: 'border-sky-600 dark:border-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60',
    badgeText: 'text-sky-900 dark:text-sky-200',
    accentBg: 'bg-sky-50 dark:bg-sky-950/40',
    softBg: 'bg-sky-50/70',
    darkSoftBg: 'dark:bg-sky-950/30',
    bannerGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    pageBgLight: '#edf4fc',
    pageBgDark: '#1e2536',
    surfaceBgDark: '#273046',
    surfaceSoftDark: '#313c57',
    borderDark: '#445273',
    accentLight: '#bae6fd',
    accentDark: '#354b6e',
  },
  {
    id: 'honey',
    name: 'Muted Peach',
    nameVi: 'Đào Cacao Pastel',
    emoji: '🍯',
    colorHex: '#e3ac68',
    primaryBg: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    primaryText: 'text-amber-700 dark:text-amber-300',
    activeBorder: 'border-amber-500 dark:border-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-900 dark:text-amber-200',
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    softBg: 'bg-amber-50/70',
    darkSoftBg: 'dark:bg-amber-950/30',
    bannerGradient: 'from-amber-400 via-orange-400 to-amber-500',
    pageBgLight: '#faf4eb',
    pageBgDark: '#2a221e',
    surfaceBgDark: '#352b26',
    surfaceSoftDark: '#41352f',
    borderDark: '#56463e',
    accentLight: '#fde68a',
    accentDark: '#634c3a',
  },
  {
    id: 'emerald',
    name: 'Dusty Teal',
    nameVi: 'Xanh Ngọc Trầm',
    emoji: '🌿',
    colorHex: '#63bfa5',
    primaryBg: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    primaryText: 'text-teal-700 dark:text-teal-300',
    activeBorder: 'border-teal-600 dark:border-teal-400',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-800 dark:text-teal-200',
    accentBg: 'bg-teal-50 dark:bg-teal-950/40',
    softBg: 'bg-teal-50/70',
    darkSoftBg: 'dark:bg-teal-950/30',
    bannerGradient: 'from-teal-500 via-emerald-500 to-teal-600',
    pageBgLight: '#eef5f6',
    pageBgDark: '#1d282b',
    surfaceBgDark: '#263438',
    surfaceSoftDark: '#304146',
    borderDark: '#42575d',
    accentLight: '#a7f3d0',
    accentDark: '#335257',
  },
];

export function getThemeSkin(id: ThemeSkinId = 'lavender'): ThemeSkin {
  return THEME_SKINS.find(s => s.id === id) || THEME_SKINS[0];
}
