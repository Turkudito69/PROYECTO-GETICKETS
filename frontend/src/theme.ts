export const colors = {
  canvas: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceSoft: '#FFFFFF',
  navy: '#152444',
  navyDark: '#0F172A',
  canvasDark: '#0B0F17',
  surfaceDark: '#171717',
  lineDark: '#262626',
  ink: '#111827',
  muted: '#64748B',
  line: '#E5E5E5',
  primary: '#0284C7',
  primaryDark: '#0284C7',
  onPrimary: '#FFFFFF',
  skySoft: '#E0F2FE',
  amber: '#FBBF24',
  amberSoft: '#FFFBEB',
  green: '#10B981',
  greenSoft: '#ECFDF5',
  teal: '#0D9488',
  indigo: '#4F46E5',
  indigoSoft: '#EEF0FF',
  red: '#E11D48',
  redSoft: '#FFF0F2',
};

export function getThemeColors(darkMode: boolean) {
  return darkMode
    ? { ...colors, canvas: colors.canvasDark, surface: colors.surfaceDark, surfaceSoft: '#1C1C1C', navy: colors.navyDark, ink: '#F5F5F5', muted: '#A3A3A3', line: colors.lineDark, skySoft: '#082F49', amberSoft: '#422006', greenSoft: '#052E25', indigoSoft: '#1E1B4B', redSoft: '#4C0519' }
    : colors;
}

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  pill: 999,
};

export const typeScale = {
  caption: 12,
  body: 14,
  title: 18,
  heading: 26,
};
