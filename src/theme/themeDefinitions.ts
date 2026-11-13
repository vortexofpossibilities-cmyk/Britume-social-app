export type ThemeBackgroundType =
  | 'gradient'
  | 'bordered'
  | 'tiles'
  | 'plain'
  | 'heavenly'
  | 'galaxy'
  | 'nature-glass'
  | 'rainbow-mesh'
  | 'luxury'
  | 'classroom'
  | 'fantasy'
  | 'button'
  | 'flag'
  | 'executive'
  | 'trading'
  | 'achievement'
  | 'ocean'
  | 'aurora'
  | 'cyber'
  | 'african'
  | 'holographic'
  | 'marble'
  | 'sunset'
  | 'carbon'
  | 'forest'
  | 'ice'
  | 'blossom'
  | 'arcade'
  | 'desert'
  | 'cosmic';

export type ThemeShape =
  | 'rounded'
  | 'square'
  | 'hexagon'
  | 'pill'
  | 'geometric'
  | 'soft'
  | 'mixed';

export type ThemeStyle = {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;

  bg: string;
  panel: string;
  panel2: string;
  panel3: string;

  text: string;
  muted: string;

  border: string;
  borderStrong: string;
  shadow: string;
  highlight: string;

  gradient: [string, string, string];

  radius: number;
  borderWidth: number;
  glow: string;
  dark: boolean;

  backgroundType: ThemeBackgroundType;
  shape: ThemeShape;
  texture: string;
  lighting: string;
  depth: number;
  motion: string;
};

type ThemeOptions = Partial<
  Omit<
    ThemeStyle,
    'id' | 'name' | 'category' | 'description'
  >
>;

function makeTheme(
  id: string,
  name: string,
  category: string,
  description: string,
  options: ThemeOptions,
): ThemeStyle {
  return {
    id,
    name,
    category,
    description,

    material: '3d',

    bg: '#101B2A',
    panel: '#24344A',
    panel2: '#30445C',
    panel3: '#1B2B40',

    text: '#FFFFFF',
    muted: '#B8C8DA',

    border: '#456482',
    borderStrong: '#7598BA',
    shadow: '#080F19',
    highlight: '#FFFFFF',

    gradient: ['#30445C', '#1B2B40', '#101B2A'],

    radius: 24,
    borderWidth: 1,
    glow: 'rgba(255,255,255,0.18)',
    dark: true,

    backgroundType: 'gradient',
    shape: 'rounded',
    texture: 'smooth',
    lighting: 'soft',
    depth: 3,
    motion: 'subtle',

    ...options,
  };
}

export const THEME_STYLES: ThemeStyle[] = [

  // YOUR 15 THEMES

  makeTheme(
    'border-lined',
    'Border Lined',
    'Creative',
    'Decorative dimensional borders',
    {
      backgroundType: 'bordered',
      shape: 'geometric',
      material: 'outlined-3d',
      bg: '#101725',
      panel: '#1D2B40',
      panel2: '#263B56',
      border: '#45B5FF',
      borderStrong: '#A5DCFF',
      gradient: ['#243B59', '#15243A', '#0B1424'],
      glow: 'rgba(69,181,255,0.45)',
      texture: 'layered-lines',
      lighting: 'edge',
    },
  ),

  makeTheme(
    'tiled-3d',
    'Tiled 3D',
    '3D',
    'Raised dimensional tile surfaces',
    {
      backgroundType: 'tiles',
      shape: 'square',
      material: 'raised-tiles',
      bg: '#DCE7F2',
      panel: '#FFFFFF',
      panel2: '#B9CDE0',
      text: '#233B52',
      muted: '#617A91',
      border: '#FFFFFF',
      shadow: '#7893AD',
      gradient: ['#FFFFFF', '#DCE7F2', '#AFC6DD'],
      dark: false,
      radius: 12,
      texture: 'tiled',
      lighting: 'top-left',
      depth: 5,
    },
  ),

  makeTheme(
    'plain',
    'Plain',
    'Minimal',
    'Simple clean appearance',
    {
      backgroundType: 'plain',
      shape: 'rounded',
      material: 'minimal',
      bg: '#F4F6F9',
      panel: '#FFFFFF',
      panel2: '#E8EDF2',
      text: '#263747',
      muted: '#718096',
      border: '#E0E6ED',
      shadow: '#BCC8D4',
      gradient: ['#FFFFFF', '#F4F6F9', '#E8EDF2'],
      dark: false,
      texture: 'none',
      lighting: 'natural',
      depth: 1,
      motion: 'none',
    },
  ),

  makeTheme(
    'god',
    'God',
    'Heavenly',
    'Majestic heavenly-inspired appearance',
    {
      backgroundType: 'heavenly',
      shape: 'soft',
      material: 'celestial',
      bg: '#171B38',
      panel: '#34365E',
      panel2: '#484A75',
      border: '#E8D49B',
      borderStrong: '#FFF0BE',
      shadow: '#080B20',
      gradient: ['#FFF0BE', '#6B6BA0', '#171B38'],
      glow: 'rgba(255,225,160,0.55)',
      texture: 'soft-clouds',
      lighting: 'golden-rays',
      depth: 5,
    },
  ),

  makeTheme(
    'vortex-galaxy',
    'Vortex Galaxy',
    'Cosmic',
    'Spiralling cosmic space',
    {
      backgroundType: 'galaxy',
      shape: 'geometric',
      material: 'cosmic',
      bg: '#09091F',
      panel: '#201A4A',
      panel2: '#34245F',
      border: '#8B72FF',
      borderStrong: '#D5A8FF',
      shadow: '#030311',
      gradient: ['#7C42B5', '#241B56', '#08091E'],
      glow: 'rgba(160,100,255,0.6)',
      texture: 'nebula',
      lighting: 'cosmic-glow',
      depth: 5,
    },
  ),

  makeTheme(
    'nature-glass',
    'Transparent Glass with Nature Inside',
    'Nature',
    'Transparent glass with natural scenery',
    {
      backgroundType: 'nature-glass',
      shape: 'rounded',
      material: 'nature-glass',
      bg: '#173C35',
      panel: 'rgba(235,255,245,0.76)',
      panel2: 'rgba(180,230,205,0.52)',
      text: '#143D30',
      muted: '#456D5C',
      border: 'rgba(255,255,255,0.85)',
      borderStrong: '#FFFFFF',
      shadow: '#092B22',
      gradient: ['#D9FFE9', '#75BFA0', '#16483A'],
      glow: 'rgba(170,255,210,0.45)',
      texture: 'nature',
      lighting: 'filtered-sunlight',
      depth: 4,
    },
  ),

  makeTheme(
    'rainbow-mesh',
    'Mesh Black Metal with Rainbow Light Inside',
    'Metal',
    'Black metal with rainbow illumination',
    {
      backgroundType: 'rainbow-mesh',
      shape: 'geometric',
      material: 'rainbow-metal',
      bg: '#090A0D',
      panel: '#202126',
      panel2: '#303137',
      border: '#6A6575',
      borderStrong: '#E0D9E9',
      gradient: ['#34313F', '#18191E', '#07080B'],
      glow: 'rgba(220,100,255,0.6)',
      texture: 'metal-mesh',
      lighting: 'rainbow-inner',
      depth: 5,
    },
  ),

  makeTheme(
    'britume-special',
    'BRITUME Special',
    'Luxury',
    'Soft and luxurious BRITUME signature theme',
    {
      backgroundType: 'luxury',
      shape: 'soft',
      material: 'soft-luxury',
      bg: '#F2EDE5',
      panel: '#FFFCF7',
      panel2: '#E8DED0',
      text: '#493C32',
      muted: '#897666',
      border: '#E5D5BE',
      borderStrong: '#C9A976',
      shadow: '#B5A18A',
      gradient: ['#FFFDF8', '#F0E5D4', '#D9C3A4'],
      glow: 'rgba(220,190,135,0.35)',
      dark: false,
      texture: 'soft-satin',
      lighting: 'warm-luxury',
      depth: 4,
    },
  ),

  makeTheme(
    'classroom',
    'Classroom',
    'Education',
    'Bright educational design',
    {
      backgroundType: 'classroom',
      shape: 'square',
      material: 'educational',
      bg: '#E9F2FF',
      panel: '#FFFFFF',
      panel2: '#D6E7FF',
      text: '#243C5A',
      muted: '#647C9C',
      border: '#C7DDF8',
      borderStrong: '#82AEE0',
      gradient: ['#FFFFFF', '#E5F0FF', '#C7DDF8'],
      dark: false,
      texture: 'paper',
      lighting: 'bright',
      depth: 2,
    },
  ),

  makeTheme(
    'unicorn',
    'Unicorn',
    'Fantasy',
    'Magical pastel fantasy appearance',
    {
      backgroundType: 'fantasy',
      shape: 'soft',
      material: 'pastel-fantasy',
      bg: '#F7E8FF',
      panel: '#FFFFFF',
      panel2: '#EBD7FF',
      text: '#523B70',
      muted: '#8C75A8',
      border: '#F4D5FF',
      borderStrong: '#CDA5F2',
      shadow: '#C0A4D9',
      gradient: ['#FFE6F8', '#E5D9FF', '#C8E7FF'],
      glow: 'rgba(240,170,255,0.55)',
      dark: false,
      texture: 'sparkles',
      lighting: 'rainbow-soft',
      depth: 4,
    },
  ),

  makeTheme(
    'button',
    'Button',
    '3D',
    'Raised dimensional button design',
    {
      backgroundType: 'button',
      shape: 'pill',
      material: 'button-3d',
      bg: '#E4ECF7',
      panel: '#FFFFFF',
      panel2: '#C9D7EA',
      text: '#263B56',
      muted: '#6E829B',
      border: '#FFFFFF',
      borderStrong: '#B5C8E0',
      shadow: '#8DA4C0',
      gradient: ['#FFFFFF', '#E3ECF8', '#B7CBE2'],
      dark: false,
      texture: 'polished',
      lighting: 'raised',
      depth: 6,
    },
  ),

  makeTheme(
    'britume-flag',
    'BRITUME 3D Flag Logo',
    'Brand',
    'Dimensional BRITUME flag identity',
    {
      backgroundType: 'flag',
      shape: 'geometric',
      material: 'brand-3d',
      bg: '#101D36',
      panel: '#243B61',
      panel2: '#34547D',
      border: '#6FB8FF',
      borderStrong: '#FFFFFF',
      gradient: ['#347BC1', '#1B3C69', '#101D36'],
      glow: 'rgba(70,160,255,0.5)',
      texture: 'fabric',
      lighting: 'spotlight',
      depth: 5,
    },
  ),

  makeTheme(
    'wealthy-chair',
    'Wealthy Man in Chair',
    'Executive',
    'Elegant executive interior',
    {
      backgroundType: 'executive',
      shape: 'rounded',
      material: 'executive-leather',
      bg: '#17130F',
      panel: '#35271C',
      panel2: '#4A3727',
      border: '#A9804D',
      borderStrong: '#E6C58C',
      gradient: ['#745234', '#342519', '#14100D'],
      glow: 'rgba(210,165,95,0.3)',
      texture: 'leather',
      lighting: 'warm-spotlight',
      depth: 5,
    },
  ),

  makeTheme(
    'trader',
    'Trader',
    'Professional',
    'Financial dashboard-inspired appearance',
    {
      backgroundType: 'trading',
      shape: 'square',
      material: 'digital-finance',
      bg: '#071B19',
      panel: '#12342D',
      panel2: '#1B473B',
      border: '#327C64',
      borderStrong: '#63D9A0',
      gradient: ['#246B50', '#12362D', '#071A17'],
      glow: 'rgba(60,220,145,0.35)',
      texture: 'digital-grid',
      lighting: 'screen-glow',
      depth: 3,
    },
  ),

  makeTheme(
    'successer',
    'Successer',
    'Achievement',
    'Progress and achievement-inspired design',
    {
      backgroundType: 'achievement',
      shape: 'geometric',
      material: 'achievement-gold',
      bg: '#261C0D',
      panel: '#4C3716',
      panel2: '#654A1B',
      border: '#C69B3E',
      borderStrong: '#FFE08A',
      gradient: ['#F6D47B', '#76521C', '#241909'],
      glow: 'rgba(255,205,75,0.45)',
      texture: 'golden-pattern',
      lighting: 'golden-glow',
      depth: 5,
    },
  ),

  // MY ADDITIONAL 15 THEMES

  makeTheme(
    'ocean-depth',
    'Ocean Depth',
    'Nature',
    'Deep underwater atmosphere',
    {
      backgroundType: 'ocean',
      shape: 'soft',
      material: 'liquid-glass',
      bg: '#073B55',
      panel: '#12617C',
      panel2: '#1C7E96',
      border: '#65D7E8',
      gradient: ['#51C7D5', '#126B87', '#073044'],
      glow: 'rgba(75,225,255,0.4)',
      texture: 'water',
      lighting: 'underwater',
      depth: 5,
    },
  ),

  makeTheme(
    'emerald-royalty',
    'Emerald Royalty',
    'Luxury',
    'Emerald green and royal gold',
    {
      backgroundType: 'luxury',
      shape: 'geometric',
      material: 'emerald',
      bg: '#082A20',
      panel: '#164936',
      panel2: '#21634A',
      border: '#B5D7A0',
      borderStrong: '#E5D18A',
      gradient: ['#4E9468', '#164632', '#08251C'],
      glow: 'rgba(200,220,120,0.35)',
      texture: 'polished-stone',
      lighting: 'golden',
    },
  ),

  makeTheme(
    'cyber-neon',
    'Cyber Neon',
    'Futuristic',
    'Neon futuristic environment',
    {
      backgroundType: 'cyber',
      shape: 'geometric',
      material: 'neon',
      bg: '#0A0B20',
      panel: '#1B1940',
      panel2: '#29265A',
      border: '#6D5CFF',
      borderStrong: '#FF61D6',
      gradient: ['#613D9C', '#211B49', '#09091D'],
      glow: 'rgba(255,75,220,0.55)',
      texture: 'digital',
      lighting: 'neon',
      depth: 5,
    },
  ),

  makeTheme(
    'aurora-dreams',
    'Aurora Dreams',
    'Fantasy',
    'Northern lights-inspired colours',
    {
      backgroundType: 'aurora',
      shape: 'soft',
      material: 'aurora',
      bg: '#101E35',
      panel: '#1C3B4A',
      panel2: '#285A5B',
      border: '#69DCC5',
      gradient: ['#71D8C2', '#334D76', '#151A37'],
      glow: 'rgba(90,255,210,0.4)',
      texture: 'aurora',
      lighting: 'flowing-light',
      motion: 'slow',
    },
  ),

  makeTheme(
    'african-heritage',
    'African Heritage',
    'Culture',
    'African-inspired geometric patterns',
    {
      backgroundType: 'african',
      shape: 'geometric',
      material: 'woven',
      bg: '#3C2418',
      panel: '#70432A',
      panel2: '#915B35',
      border: '#D99D55',
      borderStrong: '#F1CF87',
      gradient: ['#D99D55', '#774329', '#321D16'],
      glow: 'rgba(230,165,75,0.3)',
      texture: 'geometric-weave',
      lighting: 'warm',
    },
  ),

  makeTheme(
    'holographic-world',
    'Holographic World',
    'Creative',
    'Iridescent rainbow reflections',
    {
      backgroundType: 'holographic',
      shape: 'mixed',
      material: 'holographic',
      bg: '#211B3B',
      panel: '#42375E',
      panel2: '#5D4B79',
      border: '#D9C9FF',
      gradient: ['#FFB8E6', '#A9DFFF', '#C6A5FF'],
      glow: 'rgba(190,155,255,0.55)',
      texture: 'iridescent',
      lighting: 'rainbow',
      depth: 5,
    },
  ),

  makeTheme(
    'marble-palace',
    'Marble Palace',
    'Luxury',
    'White marble architecture',
    {
      backgroundType: 'marble',
      shape: 'rounded',
      material: 'marble',
      bg: '#E9E6E0',
      panel: '#FFFFFF',
      panel2: '#DAD5CA',
      text: '#393630',
      muted: '#777166',
      border: '#D6CBB7',
      borderStrong: '#BDA77F',
      shadow: '#AAA294',
      gradient: ['#FFFFFF', '#EEEAE2', '#D2C9B9'],
      glow: 'rgba(215,185,125,0.3)',
      dark: false,
      texture: 'marble-veins',
      lighting: 'architectural',
    },
  ),

  makeTheme(
    'sunset-paradise',
    'Sunset Paradise',
    'Nature',
    'Warm sunset gradients',
    {
      backgroundType: 'sunset',
      shape: 'soft',
      material: 'sunset',
      bg: '#421D3D',
      panel: '#71365C',
      panel2: '#96506B',
      border: '#F2A477',
      gradient: ['#FFBD76', '#CE647F', '#432044'],
      glow: 'rgba(255,155,100,0.45)',
      texture: 'sunset-clouds',
      lighting: 'sunset',
    },
  ),

  makeTheme(
    'carbon-elite',
    'Carbon Elite',
    'Metal',
    'Black carbon-fibre luxury',
    {
      backgroundType: 'carbon',
      shape: 'geometric',
      material: 'carbon-fibre',
      bg: '#080A0D',
      panel: '#20252B',
      panel2: '#30373F',
      border: '#606B76',
      borderStrong: '#B6C1CC',
      gradient: ['#59636D', '#252B31', '#080A0D'],
      glow: 'rgba(180,200,220,0.22)',
      texture: 'carbon-weave',
      lighting: 'metallic',
      depth: 5,
    },
  ),

  makeTheme(
    'enchanted-forest',
    'Enchanted Forest',
    'Nature',
    'Magical glowing forest',
    {
      backgroundType: 'forest',
      shape: 'soft',
      material: 'forest',
      bg: '#09291E',
      panel: '#174B32',
      panel2: '#246441',
      border: '#70C58D',
      gradient: ['#5AAB72', '#174A30', '#082219'],
      glow: 'rgba(90,255,140,0.3)',
      texture: 'leaves',
      lighting: 'magical-green',
      depth: 4,
    },
  ),

  makeTheme(
    'crystal-ice',
    'Crystal Ice',
    'Fantasy',
    'Transparent frozen crystal surfaces',
    {
      backgroundType: 'ice',
      shape: 'geometric',
      material: 'ice-crystal',
      bg: '#D9F2FF',
      panel: '#F8FDFF',
      panel2: '#B9DFF2',
      text: '#25485E',
      muted: '#64869A',
      border: '#FFFFFF',
      borderStrong: '#91CDE9',
      shadow: '#8DB5CA',
      gradient: ['#FFFFFF', '#D9F2FF', '#A5D4EC'],
      glow: 'rgba(150,230,255,0.6)',
      dark: false,
      texture: 'ice-facets',
      lighting: 'crystal-reflection',
    },
  ),

  makeTheme(
    'blossom-world',
    'Blossom World',
    'Nature',
    'Soft cherry blossom-inspired appearance',
    {
      backgroundType: 'blossom',
      shape: 'soft',
      material: 'blossom',
      bg: '#FCEAF2',
      panel: '#FFFFFF',
      panel2: '#F6D3E2',
      text: '#673F56',
      muted: '#9A7287',
      border: '#F6C7DA',
      borderStrong: '#E8A6C3',
      shadow: '#D8A9BF',
      gradient: ['#FFFFFF', '#FCE2ED', '#EFBBD4'],
      glow: 'rgba(255,170,210,0.4)',
      dark: false,
      texture: 'petals',
      lighting: 'soft-pink',
    },
  ),

  makeTheme(
    'retro-arcade',
    'Retro Arcade',
    'Gaming',
    'Retro gaming-inspired neon surfaces',
    {
      backgroundType: 'arcade',
      shape: 'square',
      material: 'arcade',
      bg: '#170D2D',
      panel: '#342052',
      panel2: '#492B6B',
      border: '#FF66CE',
      borderStrong: '#52DCFF',
      gradient: ['#9B3C96', '#43205F', '#120B26'],
      glow: 'rgba(255,70,205,0.5)',
      texture: 'pixel-grid',
      lighting: 'arcade-neon',
      depth: 4,
    },
  ),

  makeTheme(
    'golden-desert',
    'Golden Desert',
    'Nature',
    'Golden sand and warm light',
    {
      backgroundType: 'desert',
      shape: 'soft',
      material: 'sandstone',
      bg: '#4A321B',
      panel: '#8B6338',
      panel2: '#B1844C',
      border: '#E9C48A',
      borderStrong: '#FFE2A8',
      gradient: ['#F3D08B', '#B17D43', '#50341C'],
      glow: 'rgba(255,200,110,0.35)',
      texture: 'sandstone',
      lighting: 'desert-sun',
    },
  ),

  makeTheme(
    'dark-matter',
    'Dark Matter',
    'Cosmic',
    'Deep mysterious cosmic surfaces',
    {
      backgroundType: 'cosmic',
      shape: 'geometric',
      material: 'dark-cosmic',
      bg: '#05050D',
      panel: '#17142A',
      panel2: '#25203E',
      border: '#62508D',
      borderStrong: '#9C80D6',
      gradient: ['#40305E', '#19142C', '#05050D'],
      glow: 'rgba(135,95,220,0.4)',
      texture: 'dark-nebula',
      lighting: 'deep-space',
      depth: 5,
    },
  ),
];

export const DEFAULT_THEME_ID = 'britume-special';

export function getThemeStyle(id: string): ThemeStyle {
  return (
    THEME_STYLES.find((item) => item.id === id) ??
    THEME_STYLES.find((item) => item.id === DEFAULT_THEME_ID)!
  );
}
