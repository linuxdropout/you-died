import type { Arena } from './arena.ts'
import { nextSeed, seedToFloat } from './rng.ts'

export type MapTier = 'small' | 'medium' | 'large'

export function getTierForPlayerCount(count: number): MapTier {
  if (count <= 4) return 'small'
  if (count <= 8) return 'medium'
  return 'large'
}

// --- Small maps (1-4 players, ~2560×1440) ---

const SMALL_MAPS: Arena[] = [
  // "Ruins" — split ground with central tower
  {
    width: 2560,
    height: 1440,
    killBoundary: 1520,
    platforms: [
      // ground sections (split with gap)
      { x: 100, y: 1100, width: 900, height: 16 },
      { x: 1560, y: 1100, width: 900, height: 16 },
      // mid platforms
      { x: 300, y: 1030, width: 400, height: 12 },
      { x: 1860, y: 1030, width: 400, height: 12 },
      { x: 1050, y: 1020, width: 460, height: 12 },
      // upper platforms
      { x: 150, y: 960, width: 300, height: 12 },
      { x: 2110, y: 960, width: 300, height: 12 },
      { x: 700, y: 950, width: 350, height: 12 },
      { x: 1510, y: 950, width: 350, height: 12 },
      // high platforms
      { x: 1080, y: 880, width: 400, height: 12 },
      { x: 500, y: 870, width: 250, height: 12 },
      { x: 1810, y: 870, width: 250, height: 12 },
      // walls — central pillars
      { x: 1050, y: 1020, width: 24, height: 80, isWall: true },
      { x: 1486, y: 1020, width: 24, height: 80, isWall: true },
    ],
    spawnPoints: [
      { x: 400, y: 1050 },
      { x: 2160, y: 1050 },
      { x: 1280, y: 970 },
      { x: 850, y: 900 },
    ],
  },
  // "Cavern" — enclosed with multiple tiers
  {
    width: 2560,
    height: 1440,
    killBoundary: 1520,
    platforms: [
      // ground
      { x: 200, y: 1150, width: 2160, height: 16 },
      // tier 1
      { x: 300, y: 1080, width: 500, height: 12 },
      { x: 1050, y: 1090, width: 460, height: 12 },
      { x: 1760, y: 1080, width: 500, height: 12 },
      // tier 2
      { x: 150, y: 1010, width: 350, height: 12 },
      { x: 700, y: 1000, width: 400, height: 12 },
      { x: 1460, y: 1000, width: 400, height: 12 },
      { x: 2060, y: 1010, width: 350, height: 12 },
      // tier 3
      { x: 500, y: 930, width: 500, height: 12 },
      { x: 1560, y: 930, width: 500, height: 12 },
      { x: 1080, y: 920, width: 400, height: 12 },
      // top
      { x: 900, y: 850, width: 760, height: 12 },
      // walls
      { x: 680, y: 1000, width: 20, height: 80, isWall: true },
      { x: 1860, y: 1000, width: 20, height: 80, isWall: true },
      { x: 1260, y: 920, width: 20, height: 80, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 1100 },
      { x: 2060, y: 1100 },
      { x: 900, y: 950 },
      { x: 1660, y: 950 },
    ],
  },
  // "Bridges" — floating platforms over void
  {
    width: 2560,
    height: 1440,
    killBoundary: 1520,
    platforms: [
      // three ground islands
      { x: 100, y: 1100, width: 600, height: 16 },
      { x: 980, y: 1100, width: 600, height: 16 },
      { x: 1860, y: 1100, width: 600, height: 16 },
      // bridge platforms connecting islands
      { x: 600, y: 1030, width: 200, height: 12 },
      { x: 1480, y: 1030, width: 200, height: 12 },
      // mid tier
      { x: 200, y: 960, width: 350, height: 12 },
      { x: 800, y: 950, width: 300, height: 12 },
      { x: 1460, y: 950, width: 300, height: 12 },
      { x: 2010, y: 960, width: 350, height: 12 },
      // upper tier
      { x: 450, y: 890, width: 400, height: 12 },
      { x: 1100, y: 880, width: 360, height: 12 },
      { x: 1710, y: 890, width: 400, height: 12 },
      // top
      { x: 700, y: 820, width: 300, height: 12 },
      { x: 1560, y: 820, width: 300, height: 12 },
      { x: 1080, y: 810, width: 400, height: 12 },
      // walls on islands
      { x: 380, y: 1030, width: 20, height: 70, isWall: true },
      { x: 2160, y: 1030, width: 20, height: 70, isWall: true },
    ],
    spawnPoints: [
      { x: 400, y: 1050 },
      { x: 2160, y: 1050 },
      { x: 1280, y: 1050 },
      { x: 1280, y: 760 },
    ],
  },
]

// --- Medium maps (5-8 players, ~3840×2160) ---

const MEDIUM_MAPS: Arena[] = [
  // "Fortress" — large central structure with wings
  {
    width: 3840,
    height: 2160,
    killBoundary: 2240,
    platforms: [
      // ground level — split into sections
      { x: 100, y: 1750, width: 1100, height: 16 },
      { x: 1500, y: 1750, width: 840, height: 16 },
      { x: 2640, y: 1750, width: 1100, height: 16 },
      // lower mid
      { x: 300, y: 1680, width: 600, height: 12 },
      { x: 1600, y: 1690, width: 640, height: 12 },
      { x: 2940, y: 1680, width: 600, height: 12 },
      // mid platforms
      { x: 150, y: 1610, width: 500, height: 12 },
      { x: 850, y: 1620, width: 450, height: 12 },
      { x: 1700, y: 1610, width: 440, height: 12 },
      { x: 2540, y: 1620, width: 450, height: 12 },
      { x: 3190, y: 1610, width: 500, height: 12 },
      // upper mid
      { x: 400, y: 1540, width: 500, height: 12 },
      { x: 1200, y: 1550, width: 400, height: 12 },
      { x: 2240, y: 1550, width: 400, height: 12 },
      { x: 2940, y: 1540, width: 500, height: 12 },
      { x: 1650, y: 1530, width: 540, height: 12 },
      // high platforms
      { x: 700, y: 1470, width: 500, height: 12 },
      { x: 1550, y: 1460, width: 740, height: 12 },
      { x: 2640, y: 1470, width: 500, height: 12 },
      // top
      { x: 1200, y: 1400, width: 400, height: 12 },
      { x: 2240, y: 1400, width: 400, height: 12 },
      { x: 1700, y: 1340, width: 440, height: 12 },
      // walls — fortress walls
      { x: 1200, y: 1620, width: 24, height: 130, isWall: true },
      { x: 2616, y: 1620, width: 24, height: 130, isWall: true },
      { x: 1880, y: 1530, width: 24, height: 160, isWall: true },
      { x: 1936, y: 1530, width: 24, height: 160, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 1700 },
      { x: 3340, y: 1700 },
      { x: 1920, y: 1700 },
      { x: 600, y: 1560 },
      { x: 3240, y: 1560 },
      { x: 1920, y: 1480 },
      { x: 1400, y: 1350 },
      { x: 2440, y: 1350 },
    ],
  },
  // "Abyss" — vertical map with deep pit
  {
    width: 3840,
    height: 2160,
    killBoundary: 2240,
    platforms: [
      // ground — two sides with central pit
      { x: 100, y: 1800, width: 1400, height: 16 },
      { x: 2340, y: 1800, width: 1400, height: 16 },
      // pit platforms (descending)
      { x: 1600, y: 1860, width: 640, height: 12 },
      { x: 1700, y: 1930, width: 440, height: 12 },
      // lower tier
      { x: 200, y: 1730, width: 500, height: 12 },
      { x: 900, y: 1740, width: 400, height: 12 },
      { x: 2540, y: 1740, width: 400, height: 12 },
      { x: 3140, y: 1730, width: 500, height: 12 },
      // mid tier
      { x: 400, y: 1660, width: 600, height: 12 },
      { x: 1500, y: 1670, width: 840, height: 12 },
      { x: 2840, y: 1660, width: 600, height: 12 },
      // upper tier
      { x: 200, y: 1590, width: 450, height: 12 },
      { x: 850, y: 1580, width: 500, height: 12 },
      { x: 1650, y: 1570, width: 540, height: 12 },
      { x: 2490, y: 1580, width: 500, height: 12 },
      { x: 3190, y: 1590, width: 450, height: 12 },
      // high tier
      { x: 600, y: 1510, width: 500, height: 12 },
      { x: 1600, y: 1500, width: 640, height: 12 },
      { x: 2740, y: 1510, width: 500, height: 12 },
      // top
      { x: 1300, y: 1430, width: 500, height: 12 },
      { x: 2040, y: 1430, width: 500, height: 12 },
      { x: 1700, y: 1380, width: 440, height: 12 },
      // walls around pit
      { x: 1500, y: 1670, width: 24, height: 130, isWall: true },
      { x: 2316, y: 1670, width: 24, height: 130, isWall: true },
    ],
    spawnPoints: [
      { x: 600, y: 1750 },
      { x: 3240, y: 1750 },
      { x: 1920, y: 1810 },
      { x: 400, y: 1610 },
      { x: 3440, y: 1610 },
      { x: 1920, y: 1620 },
      { x: 1100, y: 1530 },
      { x: 2740, y: 1530 },
    ],
  },
  // "Maze" — lots of walls creating corridors
  {
    width: 3840,
    height: 2160,
    killBoundary: 2240,
    platforms: [
      // ground — full width
      { x: 100, y: 1800, width: 3640, height: 16 },
      // tier 1
      { x: 200, y: 1730, width: 700, height: 12 },
      { x: 1200, y: 1740, width: 600, height: 12 },
      { x: 2040, y: 1740, width: 600, height: 12 },
      { x: 2940, y: 1730, width: 700, height: 12 },
      // tier 2
      { x: 400, y: 1660, width: 500, height: 12 },
      { x: 1100, y: 1650, width: 500, height: 12 },
      { x: 1800, y: 1660, width: 240, height: 12 },
      { x: 2240, y: 1650, width: 500, height: 12 },
      { x: 2940, y: 1660, width: 500, height: 12 },
      // tier 3
      { x: 200, y: 1590, width: 600, height: 12 },
      { x: 1050, y: 1580, width: 500, height: 12 },
      { x: 1750, y: 1590, width: 340, height: 12 },
      { x: 2290, y: 1580, width: 500, height: 12 },
      { x: 3040, y: 1590, width: 600, height: 12 },
      // tier 4
      { x: 500, y: 1520, width: 600, height: 12 },
      { x: 1500, y: 1510, width: 840, height: 12 },
      { x: 2740, y: 1520, width: 600, height: 12 },
      // top
      { x: 1200, y: 1450, width: 500, height: 12 },
      { x: 2140, y: 1450, width: 500, height: 12 },
      { x: 1650, y: 1390, width: 540, height: 12 },
      // maze walls — vertical dividers spanning 2 tiers for meaningful barriers
      { x: 900, y: 1660, width: 20, height: 140, isWall: true },
      { x: 2920, y: 1660, width: 20, height: 140, isWall: true },
      { x: 1560, y: 1590, width: 20, height: 140, isWall: true },
      { x: 2260, y: 1590, width: 20, height: 140, isWall: true },
      { x: 800, y: 1590, width: 20, height: 140, isWall: true },
      { x: 3020, y: 1590, width: 20, height: 140, isWall: true },
      { x: 1480, y: 1510, width: 20, height: 140, isWall: true },
      { x: 2360, y: 1510, width: 20, height: 140, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 1750 },
      { x: 3340, y: 1750 },
      { x: 1500, y: 1690 },
      { x: 2340, y: 1690 },
      { x: 500, y: 1540 },
      { x: 3340, y: 1540 },
      { x: 1920, y: 1460 },
      { x: 1920, y: 1340 },
    ],
  },
]

// --- Large maps (9-12 players, ~5120×2880) ---

const LARGE_MAPS: Arena[] = [
  // "Colosseum" — massive arena with rings of platforms
  {
    width: 5120,
    height: 2880,
    killBoundary: 2960,
    platforms: [
      // ground — three large sections
      { x: 100, y: 2350, width: 1500, height: 16 },
      { x: 2010, y: 2350, width: 1100, height: 16 },
      { x: 3520, y: 2350, width: 1500, height: 16 },
      // ring 1
      { x: 200, y: 2280, width: 600, height: 12 },
      { x: 1100, y: 2290, width: 500, height: 12 },
      { x: 1900, y: 2280, width: 500, height: 12 },
      { x: 2720, y: 2280, width: 500, height: 12 },
      { x: 3520, y: 2290, width: 500, height: 12 },
      { x: 4320, y: 2280, width: 600, height: 12 },
      // ring 2
      { x: 400, y: 2210, width: 600, height: 12 },
      { x: 1300, y: 2200, width: 500, height: 12 },
      { x: 2160, y: 2210, width: 700, height: 12 },
      { x: 3320, y: 2200, width: 500, height: 12 },
      { x: 4120, y: 2210, width: 600, height: 12 },
      // ring 3
      { x: 200, y: 2140, width: 500, height: 12 },
      { x: 900, y: 2130, width: 600, height: 12 },
      { x: 1800, y: 2140, width: 500, height: 12 },
      { x: 2510, y: 2120, width: 700, height: 12 },
      { x: 3620, y: 2130, width: 600, height: 12 },
      { x: 4420, y: 2140, width: 500, height: 12 },
      // ring 4
      { x: 600, y: 2070, width: 700, height: 12 },
      { x: 1600, y: 2060, width: 600, height: 12 },
      { x: 2360, y: 2050, width: 400, height: 12 },
      { x: 2920, y: 2060, width: 600, height: 12 },
      { x: 3820, y: 2070, width: 700, height: 12 },
      // high tier
      { x: 1000, y: 2000, width: 600, height: 12 },
      { x: 2060, y: 1990, width: 1000, height: 12 },
      { x: 3520, y: 2000, width: 600, height: 12 },
      // top
      { x: 1800, y: 1930, width: 600, height: 12 },
      { x: 2720, y: 1930, width: 600, height: 12 },
      { x: 2260, y: 1870, width: 600, height: 12 },
      // walls — arena pillars
      { x: 1600, y: 2210, width: 24, height: 140, isWall: true },
      { x: 3496, y: 2210, width: 24, height: 140, isWall: true },
      { x: 2360, y: 2050, width: 24, height: 160, isWall: true },
      { x: 2736, y: 2050, width: 24, height: 160, isWall: true },
      { x: 900, y: 2070, width: 24, height: 140, isWall: true },
      { x: 4196, y: 2070, width: 24, height: 140, isWall: true },
    ],
    spawnPoints: [
      { x: 600, y: 2300 },
      { x: 4520, y: 2300 },
      { x: 2560, y: 2300 },
      { x: 1400, y: 2230 },
      { x: 3720, y: 2230 },
      { x: 600, y: 2160 },
      { x: 4520, y: 2160 },
      { x: 2560, y: 2160 },
      { x: 1200, y: 2080 },
      { x: 3920, y: 2080 },
      { x: 2560, y: 2000 },
      { x: 2560, y: 1820 },
    ],
  },
  // "Skylands" — floating islands at varying heights
  {
    width: 5120,
    height: 2880,
    killBoundary: 2960,
    platforms: [
      // low islands
      { x: 100, y: 2400, width: 800, height: 16 },
      { x: 1200, y: 2370, width: 700, height: 16 },
      { x: 2210, y: 2400, width: 700, height: 16 },
      { x: 3220, y: 2370, width: 700, height: 16 },
      { x: 4220, y: 2400, width: 800, height: 16 },
      // connectors
      { x: 800, y: 2340, width: 300, height: 12 },
      { x: 1800, y: 2350, width: 300, height: 12 },
      { x: 2810, y: 2350, width: 300, height: 12 },
      { x: 3820, y: 2340, width: 300, height: 12 },
      // mid islands
      { x: 200, y: 2270, width: 600, height: 12 },
      { x: 1050, y: 2260, width: 500, height: 12 },
      { x: 1850, y: 2270, width: 420, height: 12 },
      { x: 2560, y: 2250, width: 600, height: 12 },
      { x: 3460, y: 2270, width: 500, height: 12 },
      { x: 4350, y: 2260, width: 570, height: 12 },
      // upper islands
      { x: 400, y: 2200, width: 500, height: 12 },
      { x: 1200, y: 2190, width: 600, height: 12 },
      { x: 2160, y: 2200, width: 800, height: 12 },
      { x: 3320, y: 2190, width: 600, height: 12 },
      { x: 4220, y: 2200, width: 500, height: 12 },
      // high islands
      { x: 700, y: 2130, width: 500, height: 12 },
      { x: 1600, y: 2120, width: 500, height: 12 },
      { x: 2360, y: 2120, width: 400, height: 12 },
      { x: 3020, y: 2120, width: 500, height: 12 },
      { x: 3920, y: 2130, width: 500, height: 12 },
      // sky platforms
      { x: 1100, y: 2060, width: 600, height: 12 },
      { x: 2060, y: 2050, width: 1000, height: 12 },
      { x: 3420, y: 2060, width: 600, height: 12 },
      // top
      { x: 1800, y: 1990, width: 600, height: 12 },
      { x: 2720, y: 1990, width: 600, height: 12 },
      { x: 2260, y: 1930, width: 600, height: 12 },
      // walls on large islands
      { x: 500, y: 2340, width: 20, height: 60, isWall: true },
      { x: 4620, y: 2340, width: 20, height: 60, isWall: true },
      { x: 2210, y: 2340, width: 20, height: 60, isWall: true },
      { x: 2890, y: 2340, width: 20, height: 60, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 2350 },
      { x: 4620, y: 2350 },
      { x: 1560, y: 2320 },
      { x: 3560, y: 2320 },
      { x: 2560, y: 2350 },
      { x: 500, y: 2220 },
      { x: 4620, y: 2210 },
      { x: 1500, y: 2140 },
      { x: 3620, y: 2140 },
      { x: 2560, y: 2150 },
      { x: 2560, y: 2000 },
      { x: 2560, y: 1880 },
    ],
  },
  // "Bunker" — enclosed with heavy wall usage
  {
    width: 5120,
    height: 2880,
    killBoundary: 2960,
    platforms: [
      // ground — full width with gaps
      { x: 100, y: 2400, width: 1200, height: 16 },
      { x: 1600, y: 2400, width: 1920, height: 16 },
      { x: 3820, y: 2400, width: 1200, height: 16 },
      // tier 1
      { x: 200, y: 2330, width: 700, height: 12 },
      { x: 1100, y: 2340, width: 500, height: 12 },
      { x: 1900, y: 2330, width: 500, height: 12 },
      { x: 2560, y: 2340, width: 600, height: 12 },
      { x: 3520, y: 2340, width: 500, height: 12 },
      { x: 4220, y: 2330, width: 700, height: 12 },
      // tier 2
      { x: 300, y: 2260, width: 600, height: 12 },
      { x: 1150, y: 2250, width: 500, height: 12 },
      { x: 1900, y: 2260, width: 600, height: 12 },
      { x: 2760, y: 2250, width: 600, height: 12 },
      { x: 3620, y: 2250, width: 500, height: 12 },
      { x: 4220, y: 2260, width: 600, height: 12 },
      // tier 3
      { x: 200, y: 2190, width: 500, height: 12 },
      { x: 900, y: 2180, width: 600, height: 12 },
      { x: 1800, y: 2190, width: 600, height: 12 },
      { x: 2720, y: 2180, width: 600, height: 12 },
      { x: 3620, y: 2180, width: 600, height: 12 },
      { x: 4420, y: 2190, width: 500, height: 12 },
      // tier 4
      { x: 500, y: 2120, width: 700, height: 12 },
      { x: 1500, y: 2110, width: 700, height: 12 },
      { x: 2420, y: 2100, width: 280, height: 12 },
      { x: 2920, y: 2110, width: 700, height: 12 },
      { x: 3920, y: 2120, width: 700, height: 12 },
      // high tier
      { x: 800, y: 2050, width: 600, height: 12 },
      { x: 1700, y: 2040, width: 700, height: 12 },
      { x: 2720, y: 2040, width: 700, height: 12 },
      { x: 3720, y: 2050, width: 600, height: 12 },
      // top
      { x: 1400, y: 1980, width: 600, height: 12 },
      { x: 2260, y: 1970, width: 600, height: 12 },
      { x: 3120, y: 1980, width: 600, height: 12 },
      { x: 2160, y: 1920, width: 800, height: 12 },
      // walls — bunker dividers spanning 2 tiers
      { x: 1300, y: 2260, width: 24, height: 140, isWall: true },
      { x: 3796, y: 2260, width: 24, height: 140, isWall: true },
      { x: 1850, y: 2190, width: 24, height: 140, isWall: true },
      { x: 3246, y: 2190, width: 24, height: 140, isWall: true },
      { x: 700, y: 2190, width: 24, height: 140, isWall: true },
      { x: 4396, y: 2190, width: 24, height: 140, isWall: true },
      { x: 1500, y: 2110, width: 24, height: 140, isWall: true },
      { x: 3596, y: 2110, width: 24, height: 140, isWall: true },
      { x: 2400, y: 2100, width: 24, height: 150, isWall: true },
      { x: 2696, y: 2100, width: 24, height: 150, isWall: true },
    ],
    spawnPoints: [
      { x: 600, y: 2350 },
      { x: 4520, y: 2350 },
      { x: 2560, y: 2350 },
      { x: 1360, y: 2280 },
      { x: 3760, y: 2280 },
      { x: 600, y: 2210 },
      { x: 4520, y: 2210 },
      { x: 2060, y: 2210 },
      { x: 3060, y: 2210 },
      { x: 1200, y: 2130 },
      { x: 3920, y: 2130 },
      { x: 2560, y: 1870 },
    ],
  },
]

const MAP_POOLS: Record<MapTier, Arena[]> = {
  small: SMALL_MAPS,
  medium: MEDIUM_MAPS,
  large: LARGE_MAPS,
}

export function selectArena(seed: number, playerCount: number): Arena {
  const tier = getTierForPlayerCount(playerCount)
  const pool = MAP_POOLS[tier]
  const mapSeed = nextSeed(seed)
  const index = Math.floor(seedToFloat(mapSeed) * pool.length)
  // seedToFloat returns [0, 1) so index is always in bounds
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return pool[index]!
}
