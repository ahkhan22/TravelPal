import { Platform, useColorScheme } from 'react-native';

// The TravelPal palette — a warm, Mughal-tile identity: saffron + peacock teal
// on a warm paper ground. Mirrors the shareable-summary prototype.
const light = {
  paper: '#F4EFE3',
  surface: '#FFFDF6',
  surfaceAlt: '#FBF6EA',
  ink: '#20292A',
  inkSoft: '#6C675A',
  line: '#E4DCC9',
  saffron: '#C98A00',
  teal: '#0F5D63',
  brick: '#A9432A',
  good: '#3E7C4E',
  onAccent: '#FFFFFF',
};

const dark = {
  paper: '#101617',
  surface: '#18211F',
  surfaceAlt: '#1E2826',
  ink: '#ECE6D6',
  inkSoft: '#98937F',
  line: '#2A3433',
  saffron: '#E7B44A',
  teal: '#49A7AF',
  brick: '#D46B4D',
  good: '#6FB57F',
  onAccent: '#0B1112',
};

export type ThemeColors = typeof light;

export const fonts = {
  // A serif display face for headings, using platform serifs (no font download).
  display: Platform.select({ ios: 'Palatino', android: 'serif', default: 'serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 18, xl: 26, xxl: 36 };

export interface Theme {
  colors: ThemeColors;
  dark: boolean;
  fonts: typeof fonts;
  radius: typeof radius;
  space: typeof space;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    colors: isDark ? dark : light,
    dark: isDark,
    fonts,
    radius,
    space,
  };
}
