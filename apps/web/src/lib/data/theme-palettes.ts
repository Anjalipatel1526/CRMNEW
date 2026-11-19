export interface CardPalette {
  accent: string;
  lightBg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  glow: string;
  themeName: string;
}

export const APP_CARD_PALETTES: CardPalette[] = [
  {
    accent: '#0284C7',
    lightBg: '#F0F9FF',
    border: 'rgba(2, 132, 199, 0.28)',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    glow: 'rgba(2, 132, 199, 0.18)',
    themeName: 'Sky Blue',
  },
  {
    accent: '#4F46E5',
    lightBg: '#EEF2FF',
    border: 'rgba(79, 70, 229, 0.28)',
    badgeBg: '#EEF2FF',
    badgeText: '#4338CA',
    glow: 'rgba(79, 70, 229, 0.18)',
    themeName: 'Royal Indigo',
  },
  {
    accent: '#16A34A',
    lightBg: '#F0FDF4',
    border: 'rgba(22, 163, 74, 0.28)',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    glow: 'rgba(22, 163, 74, 0.18)',
    themeName: 'Emerald Pearl',
  },
  {
    accent: '#7C3AED',
    lightBg: '#F5F3FF',
    border: 'rgba(124, 58, 237, 0.28)',
    badgeBg: '#F5F3FF',
    badgeText: '#6D28D9',
    glow: 'rgba(124, 58, 237, 0.18)',
    themeName: 'Imperial Violet',
  },
  {
    accent: '#0D9488',
    lightBg: '#F0FDFA',
    border: 'rgba(13, 148, 136, 0.28)',
    badgeBg: '#CCFBF1',
    badgeText: '#0F766E',
    glow: 'rgba(13, 148, 136, 0.18)',
    themeName: 'Oceanic Teal',
  },
  {
    accent: '#D97706',
    lightBg: '#FFFBEB',
    border: 'rgba(217, 119, 6, 0.28)',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    glow: 'rgba(217, 119, 6, 0.18)',
    themeName: 'Warm Amber',
  },
  {
    accent: '#E11D48',
    lightBg: '#FFF1F2',
    border: 'rgba(225, 29, 72, 0.28)',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
    glow: 'rgba(225, 29, 72, 0.18)',
    themeName: 'Crimson Rose',
  },
];
