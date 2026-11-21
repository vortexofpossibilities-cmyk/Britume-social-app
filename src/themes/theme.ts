
// BRITUME — TIER 6
// Royal Blue 3D Claymorphism Design System
// Vortex of Possibilities

export const theme = {
  // Main background
  bg: '#050914',
  panel: '#0B1425',
  panel2: '#101E34',
  panel3: '#071020',

  // Text
  text: '#F5F8FF',
  muted: '#AABBD3',
  liquidText: '#D5E1F2',
  textLight: '#FFFFFF',

  // Brand colours
  cyan: '#087BFF',
  blue: '#087BFF',
  blueLight: '#55A8FF',
  blueDark: '#064DAA',
  purple: '#356DCE',
  purpleLight: '#75A9FF',
  gold: '#D9A83E',
  yellow: '#F1C66B',

  // Glass effects
  glass: 'rgba(11, 20, 37, 0.96)',
  glassLight: 'rgba(16, 30, 52, 0.92)',
  glassBorder: 'rgba(8, 123, 255, 0.48)',

  // Borders and status
  border: 'rgba(31,125,255,0.52)',
  borderStrong: '#D9A83E',
  danger: '#D64545',
  success: '#20B878',
  warning: '#E9A928',

  // Claymorphism surfaces
  clay: '#0B1425',
  clayBlue: '#101E34',
  clayPurple: '#13294A',
  clayPressed: '#071020',

  // Shadows
  shadow: '#02050B',
  shadowDark: '#02050B',
  shadowLight: '#1C4F86',

  // Glow effects
  glowBlue: 'rgba(8, 123, 255, 0.68)',
  glowPurple: 'rgba(8, 123, 255, 0.28)',
  glowGold: 'rgba(217, 168, 62, 0.48)',

  // Brand identity
  milky: '#0B1425',
  milkySoft: '#101E34',
  oilBlue: '#087BFF',
  oilGrey: '#AABBD3',
  oilYellow: '#D9A83E',
  highlight: '#F1C66B',

  // Tier 6 shared clay styles
  // React Native does not expose true inset shadows consistently across
  // Android and web. These low-elevation dark edges plus neon borders provide
  // a recessed visual treatment without the old raised clay appearance.
  clayShadow: {
    shadowColor: '#02050B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(8,123,255,0.28)',
  },

  clayRaised: {
    shadowColor: '#02050B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(8,123,255,0.34)',
  },

  clayPressedStyle: {
    shadowColor: '#02050B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(217,168,62,0.45)',
  },
};
