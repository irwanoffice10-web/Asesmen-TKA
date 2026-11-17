import { AppThemeId, AppThemeMeta } from '../types/assessment';

export const DEFAULT_APP_THEME: AppThemeId = 'nusantara';

export const APP_THEMES: AppThemeMeta[] = [
  {
    id: 'nusantara',
    name: 'Samudra Nusantara',
    subtitle: 'Biru Azure · Indigo · Emas',
    swatches: ['#0284c7', '#4f46e5', '#f59e0b'],
  },
  {
    id: 'zamrud',
    name: 'Zamrud Khatulistiwa',
    subtitle: 'Emerald · Toska · Kuning',
    swatches: ['#059669', '#0d9488', '#eab308'],
  },
  {
    id: 'mentari',
    name: 'Mentari Cendekia',
    subtitle: 'Oranye · Koral · Ungu',
    swatches: ['#ea580c', '#e11d48', '#7c3aed'],
  },
  {
    id: 'angkasa',
    name: 'Angkasa Akademia',
    subtitle: 'Indigo · Violet · Sian',
    swatches: ['#4f46e5', '#7c3aed', '#06b6d4'],
  },
  {
    id: 'delima',
    name: 'Delima Merdeka',
    subtitle: 'Merah · Amber · Biru',
    swatches: ['#e11d48', '#d97706', '#0284c7'],
  },
];
