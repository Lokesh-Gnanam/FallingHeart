import { useProfileStore } from '../store/profileStore';

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
  buttonGradient: readonly [string, string];
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  glow: string;
  white: string;
  transparent: string;
  error: string;
  success: string;
}

export const LIGHT_COLORS: ThemeColors = {
  background: '#F8F4F8',
  primary: '#D9006C',
  secondary: '#E50072',
  buttonGradient: ['#E50072', '#D9006C'] as const,
  cardBackground: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#7A6B74',
  border: '#E8D6DF',
  glow: 'rgba(217, 0, 108, 0.20)',
  white: '#FFFFFF',
  transparent: 'transparent',
  error: '#BA1A1A',
  success: '#34C759',
};

export const DARK_COLORS: ThemeColors = {
  background: '#120C10',
  primary: '#FF6EA7',
  secondary: '#FF4081',
  buttonGradient: ['#FF4081', '#FF6EA7'] as const,
  cardBackground: '#1F161C',
  textPrimary: '#F8F4F8',
  textSecondary: '#A897A1',
  border: '#382A31',
  glow: 'rgba(255, 110, 167, 0.25)',
  white: '#FFFFFF',
  transparent: 'transparent',
  error: '#FFB4AB',
  success: '#30E267',
};

// Getter-based COLORS object for inline styles & fallback compatibility
export const COLORS = {
  get background() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.background : LIGHT_COLORS.background;
    } catch {
      return LIGHT_COLORS.background;
    }
  },
  get primary() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.primary : LIGHT_COLORS.primary;
    } catch {
      return LIGHT_COLORS.primary;
    }
  },
  get secondary() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.secondary : LIGHT_COLORS.secondary;
    } catch {
      return LIGHT_COLORS.secondary;
    }
  },
  get buttonGradient() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.buttonGradient : LIGHT_COLORS.buttonGradient;
    } catch {
      return LIGHT_COLORS.buttonGradient;
    }
  },
  get cardBackground() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.cardBackground : LIGHT_COLORS.cardBackground;
    } catch {
      return LIGHT_COLORS.cardBackground;
    }
  },
  get textPrimary() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.textPrimary : LIGHT_COLORS.textPrimary;
    } catch {
      return LIGHT_COLORS.textPrimary;
    }
  },
  get textSecondary() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.textSecondary : LIGHT_COLORS.textSecondary;
    } catch {
      return LIGHT_COLORS.textSecondary;
    }
  },
  get border() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.border : LIGHT_COLORS.border;
    } catch {
      return LIGHT_COLORS.border;
    }
  },
  get glow() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.glow : LIGHT_COLORS.glow;
    } catch {
      return LIGHT_COLORS.glow;
    }
  },
  get white() {
    return LIGHT_COLORS.white;
  },
  get transparent() {
    return LIGHT_COLORS.transparent;
  },
  get error() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.error : LIGHT_COLORS.error;
    } catch {
      return LIGHT_COLORS.error;
    }
  },
  get success() {
    try {
      return useProfileStore.getState().settings.darkMode ? DARK_COLORS.success : LIGHT_COLORS.success;
    } catch {
      return LIGHT_COLORS.success;
    }
  },
};

export const TYPOGRAPHY = {
  fontFamily: 'Poppins',
  weights: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
};

export const SHADOWS = {
  soft: {
    shadowColor: 'rgba(172, 36, 113, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: LIGHT_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const LAYOUT = {
  borderRadius: 32,
  padding: 24,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 32,
};

// React hook for component theme state subscription
export function useTheme() {
  const darkMode = useProfileStore((state) => state.settings.darkMode);
  const colors = darkMode ? DARK_COLORS : LIGHT_COLORS;
  return { colors, isDark: darkMode };
}
