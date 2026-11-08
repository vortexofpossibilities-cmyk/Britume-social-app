
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
};

type ThemeOptions = Partial<Omit<ThemeStyle, 'id' | 'name' | 'category' | 'description'>>;

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
    material: 'soft',
    bg: '#EAF4FF',
    panel: '#FFFFFF',
    panel2: '#DCEBFA',
    panel3: '#F4F9FF',
    text: '#19334D',
    muted: '#66829B',
    border: '#D3E6F8',
    borderStrong: '#B9D8F5',
    shadow: '#8BAECC',
    highlight: '#FFFFFF',
    gradient: ['#FFFFFF', '#EAF4FF', '#DCEBFA'],
    radius: 22,
    borderWidth: 1,
    glow: 'rgba(22,139,255,0.18)',
    dark: false,
    ...options,
  };
}

export const THEME_STYLES: ThemeStyle[] = [
  makeTheme('mirror', 'Mirror', 'Luxury', 'Reflective silver surfaces', {
    material: 'mirror',
    bg: '#DCE3EA', panel: '#FFFFFF', panel2: '#C7D0D9',
    text: '#263747', muted: '#647586', border: '#FFFFFF',
    borderStrong: '#AEBBC8', shadow: '#8293A4',
    gradient: ['#FFFFFF', '#E8EDF2', '#BFC9D3'],
    glow: 'rgba(255,255,255,0.8)',
  }),
  makeTheme('glass', 'Glass', 'Transparent', 'Frosted transparent surfaces', {
    material: 'glass',
    bg: '#C8E3F0', panel: 'rgba(255,255,255,0.72)',
    panel2: 'rgba(255,255,255,0.48)', panel3: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.85)', borderStrong: '#FFFFFF',
    shadow: '#7199B1', gradient: ['#FFFFFF', '#D9F1F8', '#A8D6E8'],
    glow: 'rgba(255,255,255,0.55)',
  }),
  makeTheme('clay', 'Clay', 'Soft 3D', 'Soft puffy 3D clay surfaces', {
    material: 'clay',
    bg: '#EAF4FF', panel: '#FFFFFF', panel2: '#DCEBFA',
    border: '#D3E6F8', shadow: '#8BAECC',
    gradient: ['#FFFFFF', '#EAF4FF', '#DCEBFA'],
  }),
  makeTheme('chrome', 'Chrome', 'Luxury', 'Shiny metallic silver and blue', {
    material: 'chrome',
    bg: '#AAB8C7', panel: '#E8EEF4', panel2: '#B8C6D4',
    text: '#182A3B', muted: '#52677B', border: '#FFFFFF',
    borderStrong: '#8295A8', shadow: '#586C80',
    gradient: ['#FFFFFF', '#C9D5E0', '#8295A8'],
    glow: 'rgba(255,255,255,0.7)',
  }),
  makeTheme('bubble', 'Bubble', 'Soft 3D', 'Glossy floating bubble surfaces', {
    material: 'bubble',
    bg: '#E4F7FF', panel: '#FFFFFF', panel2: '#C9EDFA',
    border: '#FFFFFF', borderStrong: '#A9E0F3',
    shadow: '#8DC8DD', radius: 32,
    gradient: ['#FFFFFF', '#DDF7FF', '#AEE5F6'],
    glow: 'rgba(255,255,255,0.8)',
  }),
  makeTheme('crystal', 'Crystal', 'Luxury', 'Faceted translucent crystal', {
    material: 'crystal',
    bg: '#DDEBFA', panel: '#F9FCFF', panel2: '#C8DDF4',
    border: '#FFFFFF', borderStrong: '#A8C6E8',
    shadow: '#829FC1', gradient: ['#FFFFFF', '#D8E9FF', '#A9C9F0'],
    glow: 'rgba(190,225,255,0.8)',
  }),
  makeTheme('diamond', 'Diamond', 'Luxury', 'White and silver luxury sparkle', {
    material: 'diamond',
    bg: '#E8EDF2', panel: '#FFFFFF', panel2: '#D5DDE5',
    border: '#FFFFFF', borderStrong: '#BCC8D4',
    shadow: '#8998A8', gradient: ['#FFFFFF', '#F0F3F7', '#C7D2DE'],
    glow: 'rgba(255,255,255,0.9)',
  }),
  makeTheme('metal', 'Metal', 'Material', 'Brushed steel surfaces', {
    material: 'metal',
    bg: '#303A44', panel: '#46535F', panel2: '#35414C',
    text: '#F4F7FA', muted: '#B7C2CC',
    border: '#687987', borderStrong: '#A7B5C1',
    shadow: '#17212A', gradient: ['#73818D', '#46535F', '#28343E'],
    dark: true, glow: 'rgba(210,230,245,0.2)',
  }),
  makeTheme('neon-3d', 'Neon 3D', 'Futuristic', 'Dark glowing neon surfaces', {
    material: 'neon',
    bg: '#100D24', panel: '#21163C', panel2: '#30204D',
    text: '#FFFFFF', muted: '#C2B5E8',
    border: '#8D55FF', borderStrong: '#FF64D8',
    shadow: '#05020E', gradient: ['#35205A', '#1B1434', '#090817'],
    dark: true, glow: 'rgba(255,70,220,0.65)',
  }),
  makeTheme('inflatable', 'Inflatable', 'Soft 3D', 'Puffy balloon-like surfaces', {
    material: 'inflatable',
    bg: '#FFE8EF', panel: '#FFFFFF', panel2: '#FFD0DE',
    border: '#FFFFFF', borderStrong: '#FFB4CD',
    shadow: '#DDA0B4', radius: 34,
    gradient: ['#FFFFFF', '#FFE3EC', '#FFBBD2'],
    glow: 'rgba(255,255,255,0.8)',
  }),
  makeTheme('jelly', 'Jelly', 'Transparent', 'Glossy translucent candy surfaces', {
    material: 'jelly',
    bg: '#FFE0F0', panel: 'rgba(255,255,255,0.78)',
    panel2: 'rgba(255,160,210,0.38)',
    border: '#FFFFFF', borderStrong: '#FF91C5',
    shadow: '#D88EB5', gradient: ['#FFF6FB', '#FFB8DC', '#E987C4'],
    glow: 'rgba(255,130,210,0.55)',
  }),
  makeTheme('plastic', 'Plastic', 'Material', 'Glossy colourful toy surfaces', {
    material: 'plastic',
    bg: '#E4F3FF', panel: '#FFFFFF', panel2: '#BFE2FF',
    border: '#FFFFFF', borderStrong: '#8DC8F5',
    shadow: '#78A8CC', gradient: ['#FFFFFF', '#CDEAFF', '#80C5F5'],
    glow: 'rgba(255,255,255,0.65)',
  }),
  makeTheme('wood', 'Wood', 'Material', 'Warm carved wood surfaces', {
    material: 'wood',
    bg: '#765037', panel: '#B9865B', panel2: '#936344',
    panel3: '#D1A47B', text: '#FFF8EF', muted: '#F0D5B9',
    border: '#D5A77E', borderStrong: '#70452D',
    shadow: '#3D2518', gradient: ['#D3A77D', '#A8754D', '#70452F'],
    dark: true, glow: 'rgba(255,210,160,0.2)',
  }),
  makeTheme('marble', 'Marble', 'Luxury', 'White marble with gold accents', {
    material: 'marble',
    bg: '#F0EFEC', panel: '#FFFFFF', panel2: '#E6E2DC',
    border: '#D9D2C7', borderStrong: '#C8B99D',
    shadow: '#AAA39A', gradient: ['#FFFFFF', '#F0EFEC', '#D8D2C8'],
    glow: 'rgba(212,180,110,0.25)',
  }),
  makeTheme('ice', 'Ice', 'Transparent', 'Frozen translucent blue surfaces', {
    material: 'ice',
    bg: '#D8F2FF', panel: '#F5FCFF', panel2: '#B8E4F5',
    border: '#FFFFFF', borderStrong: '#9DD9F1',
    shadow: '#76B3D0', gradient: ['#FFFFFF', '#D7F4FF', '#92D5EF'],
    glow: 'rgba(180,235,255,0.7)',
  }),
  makeTheme('water', 'Water', 'Transparent', 'Liquid blue water surfaces', {
    material: 'water',
    bg: '#B9E8F5', panel: '#E9FAFF', panel2: '#8BD4E8',
    border: '#FFFFFF', borderStrong: '#65BDD7',
    shadow: '#539FB7', gradient: ['#E9FCFF', '#8BD9ED', '#258EBA'],
    glow: 'rgba(120,230,255,0.55)',
  }),
  makeTheme('liquid-metal', 'Liquid Metal', 'Futuristic', 'Flowing liquid silver', {
    material: 'liquid-metal',
    bg: '#59636D', panel: '#AEB8C2', panel2: '#7D8994',
    text: '#17212A', muted: '#354553',
    border: '#E9F1F8', borderStrong: '#687581',
    shadow: '#303941', gradient: ['#F4F7FA', '#8D9AA5', '#45515B'],
    dark: true, glow: 'rgba(255,255,255,0.5)',
  }),
  makeTheme('holographic', 'Holographic', 'Transparent', 'Iridescent rainbow surfaces', {
    material: 'holographic',
    bg: '#EDE3FF', panel: '#FFFFFF', panel2: '#E5D7FF',
    border: '#FFFFFF', borderStrong: '#C6A9F8',
    shadow: '#A28BC7', gradient: ['#FBCBEE', '#C8E7FF', '#D8C5FF'],
    glow: 'rgba(205,180,255,0.65)',
  }),
  makeTheme('paper', 'Paper', 'Material', 'Layered paper craft surfaces', {
    material: 'paper',
    bg: '#F4EDE0', panel: '#FFFCF5', panel2: '#E9DFC9',
    text: '#4A4034', muted: '#897C6B',
    border: '#E0D4BE', borderStrong: '#C7B99F',
    shadow: '#A99B83', gradient: ['#FFFCF5', '#F1E7D5', '#DED0B8'],
    glow: 'rgba(255,255,255,0.4)',
  }),
  makeTheme('lego', 'Lego', 'Creative', 'Bold colourful block surfaces', {
    material: 'lego',
    bg: '#E7F2FF', panel: '#FFFFFF', panel2: '#D2E4FA',
    border: '#FFFFFF', borderStrong: '#9DBDE5',
    shadow: '#819AB8', radius: 12,
    gradient: ['#FFFFFF', '#E0EDFF', '#BDD5F5'],
    glow: 'rgba(255,255,255,0.5)',
  }),
  makeTheme('candy', 'Candy', 'Creative', 'Sweet glossy candy surfaces', {
    material: 'candy',
    bg: '#FFE5F1', panel: '#FFFFFF', panel2: '#FFC7DF',
    border: '#FFFFFF', borderStrong: '#FF9BC7',
    shadow: '#D98CAF', gradient: ['#FFFFFF', '#FFD8EA', '#FF9EC8'],
    glow: 'rgba(255,170,215,0.55)',
  }),
  makeTheme('cloud', 'Cloud', 'Soft 3D', 'Fluffy white cloud surfaces', {
    material: 'cloud',
    bg: '#E8F5FF', panel: '#FFFFFF', panel2: '#D8EDFF',
    border: '#FFFFFF', borderStrong: '#C2E1F8',
    shadow: '#A5C6DF', radius: 30,
    gradient: ['#FFFFFF', '#F1F9FF', '#D4EBFF'],
    glow: 'rgba(255,255,255,0.75)',
  }),
  makeTheme('velvet', 'Velvet', 'Material', 'Deep soft velvet surfaces', {
    material: 'velvet',
    bg: '#291D3B', panel: '#463052', panel2: '#382442',
    text: '#FFF7FF', muted: '#D4BEDD',
    border: '#75527D', borderStrong: '#A27AA9',
    shadow: '#130C1D', gradient: ['#65466C', '#392543', '#20172F'],
    dark: true, glow: 'rgba(190,130,220,0.25)',
  }),
  makeTheme('leather', 'Leather', 'Material', 'Stitched premium leather surfaces', {
    material: 'leather',
    bg: '#4B3025', panel: '#79513C', panel2: '#5F3D2D',
    text: '#FFF6EC', muted: '#E4C5AC',
    border: '#A77A5C', borderStrong: '#D2A47C',
    shadow: '#28170F', gradient: ['#A77857', '#704832', '#452A20'],
    dark: true, glow: 'rgba(220,170,120,0.2)',
  }),
  makeTheme('world-3d', '3D World', 'Fantasy', 'Immersive world-inspired surfaces', {
    material: 'world',
    bg: '#CBE8D6', panel: '#F4FFF5', panel2: '#B6D9C1',
    text: '#234735', muted: '#5E826B',
    border: '#FFFFFF', borderStrong: '#8EB99A',
    shadow: '#71977D', gradient: ['#E9F9E9', '#B9E1C3', '#76B58C'],
    glow: 'rgba(170,255,190,0.35)',
  }),
  makeTheme('galaxy-3d', 'Galaxy 3D', 'Fantasy', 'Deep cosmic space surfaces', {
    material: 'galaxy',
    bg: '#100E2C', panel: '#211B4B', panel2: '#30235D',
    text: '#FFFFFF', muted: '#C6B9ED',
    border: '#6E5BC1', borderStrong: '#A68BFF',
    shadow: '#070617', gradient: ['#493078', '#211B4B', '#0B0A20'],
    dark: true, glow: 'rgba(150,100,255,0.5)',
  }),
  makeTheme('ocean-3d', 'Ocean 3D', 'Fantasy', 'Deep underwater blue surfaces', {
    material: 'ocean',
    bg: '#0D526B', panel: '#16738C', panel2: '#105D76',
    text: '#F0FFFF', muted: '#B8E8ED',
    border: '#55C5D5', borderStrong: '#91E8EA',
    shadow: '#073747', gradient: ['#3CB4C6', '#126B83', '#073E5C'],
    dark: true, glow: 'rgba(90,230,245,0.35)',
  }),
  makeTheme('lava', 'Lava', 'Fantasy', 'Glowing volcanic rock surfaces', {
    material: 'lava',
    bg: '#24110D', panel: '#472018', panel2: '#652A16',
    text: '#FFF5E9', muted: '#E8B69C',
    border: '#D64B20', borderStrong: '#FF8B27',
    shadow: '#100704', gradient: ['#A33C17', '#5A2114', '#21100D'],
    dark: true, glow: 'rgba(255,90,20,0.55)',
  }),
  makeTheme('smoke', 'Smoke', 'Fantasy', 'Soft smoky grey surfaces', {
    material: 'smoke',
    bg: '#3A424B', panel: '#626D78', panel2: '#4D5862',
    text: '#FFFFFF', muted: '#D1D7DC',
    border: '#89949E', borderStrong: '#B9C1C8',
    shadow: '#20262C', gradient: ['#89949E', '#59636D', '#343C44'],
    dark: true, glow: 'rgba(210,220,230,0.22)',
  }),
  makeTheme('origami', 'Origami', 'Creative', 'Folded geometric paper surfaces', {
    material: 'origami',
    bg: '#E9E4FF', panel: '#FFFFFF', panel2: '#D6D0F6',
    text: '#39345B', muted: '#77719A',
    border: '#FFFFFF', borderStrong: '#B9B0E9',
    shadow: '#A39CCB', radius: 14,
    gradient: ['#FFFFFF', '#E6E0FF', '#C7BDF0'],
    glow: 'rgba(190,175,255,0.3)',
  }),
  makeTheme('cartoon-3d', 'Cartoon 3D', 'Creative', 'Bold playful cartoon surfaces', {
    material: 'cartoon',
    bg: '#FFF1D4', panel: '#FFFFFF', panel2: '#FFE0A0',
    text: '#30243A', muted: '#76647A',
    border: '#30243A', borderStrong: '#30243A',
    shadow: '#6F5A47', borderWidth: 2,
    gradient: ['#FFFFFF', '#FFF0C9', '#FFD88C'],
    glow: 'rgba(255,210,100,0.3)',
  }),
  makeTheme('cyber-3d', 'Cyber 3D', 'Futuristic', 'Futuristic digital surfaces', {
    material: 'cyber',
    bg: '#071923', panel: '#102D3A', panel2: '#164052',
    text: '#E7FFFF', muted: '#9ACBD2',
    border: '#27DDE0', borderStrong: '#55F4F0',
    shadow: '#020B11', gradient: ['#1B5263', '#102D3A', '#06141F'],
    dark: true, glow: 'rgba(30,240,230,0.4)',
  }),
  makeTheme('retro-3d', 'Retro 3D', 'Futuristic', '80s arcade-inspired surfaces', {
    material: 'retro',
    bg: '#211437', panel: '#39204F', panel2: '#4C2860',
    text: '#FFFFFF', muted: '#E4B7F0',
    border: '#FF65C8', borderStrong: '#48D9FF',
    shadow: '#10091C', gradient: ['#69366E', '#34204D', '#17102D'],
    dark: true, glow: 'rgba(255,75,200,0.45)',
  }),
  makeTheme('gold-3d', 'Gold 3D', 'Luxury', 'Shiny gold luxury surfaces', {
    material: 'gold',
    bg: '#392B12', panel: '#806222', panel2: '#624916',
    text: '#FFF9E8', muted: '#EEDCA8',
    border: '#E9C65D', borderStrong: '#FFE99A',
    shadow: '#211705', gradient: ['#FFE99A', '#B98A28', '#67470F'],
    dark: true, glow: 'rgba(255,205,70,0.5)',
  }),
  makeTheme('creamy-3d', 'Creamy 3D', 'Soft 3D', 'Smooth milky creamy surfaces', {
    material: 'creamy',
    bg: '#FFF3E1', panel: '#FFFCF5', panel2: '#F4E3CB',
    text: '#594633', muted: '#99836A',
    border: '#FFFFFF', borderStrong: '#E8D3B7',
    shadow: '#C5AC8E', gradient: ['#FFFCF5', '#FFF0D9', '#EAD7B9'],
    glow: 'rgba(255,255,255,0.65)',
  }),
];

export function getThemeStyle(id: string): ThemeStyle {
  return THEME_STYLES.find(item => item.id === id)
    ?? THEME_STYLES.find(item => item.id === 'clay')!;
}
