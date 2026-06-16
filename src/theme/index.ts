export const COLORS = {
  background: '#FAF8FF',
  primary: '#AC2471',
  secondary: '#E2165F',
  buttonGradient: ['#E2165F', '#AC2471'] as const,
  cardBackground: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#7A6B74',
  border: '#E8D6DF',
  glow: 'rgba(172, 36, 113, 0.20)',
  white: '#FFFFFF',
  transparent: 'transparent',
  error: '#BA1A1A',
  success: '#34C759',
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
    shadowColor: COLORS.primary,
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

