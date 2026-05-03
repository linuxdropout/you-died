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
      { x: 300, y: 950, width: 400, height: 12 },
      { x: 1860, y: 950, width: 400, height: 12 },
      { x: 1050, y: 900, width: 460, height: 12 },
      // upper platforms
      { x: 150, y: 780, width: 300, height: 12 },
      { x: 2110, y: 780, width: 300, height: 12 },
      { x: 700, y: 720, width: 350, height: 12 },
      { x: 1510, y: 720, width: 350, height: 12 },
      // high platforms
      { x: 1080, y: 600, width: 400, height: 12 },
      { x: 500, y: 550, width: 250, height: 12 },
      { x: 1810, y: 550, width: 250, height: 12 },
      // walls — central pillars
      { x: 1050, y: 900, width: 24, height: 200, isWall: true },
      { x: 1486, y: 900, width: 24, height: 200, isWall: true },
    ],
    spawnPoints: [
      { x: 400, y: 1050 },
      { x: 2160, y: 1050 },
      { x: 1280, y: 850 },
      { x: 850, y: 670 },
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
      { x: 300, y: 1000, width: 500, height: 12 },
      { x: 1050, y: 1020, width: 460, height: 12 },
      { x: 1760, y: 1000, width: 500, height: 12 },
      // tier 2
      { x: 150, y: 850, width: 350, height: 12 },
      { x: 700, y: 830, width: 400, height: 12 },
      { x: 1460, y: 830, width: 400, height: 12 },
      { x: 2060, y: 850, width: 350, height: 12 },
      // tier 3
      { x: 500, y: 660, width: 500, height: 12 },
      { x: 1560, y: 660, width: 500, height: 12 },
      { x: 1080, y: 620, width: 400, height: 12 },
      // top
      { x: 900, y: 480, width: 760, height: 12 },
      // walls
      { x: 680, y: 830, width: 20, height: 170, isWall: true },
      { x: 1860, y: 830, width: 20, height: 170, isWall: true },
      { x: 1260, y: 620, width: 20, height: 210, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 1100 },
      { x: 2060, y: 1100 },
      { x: 900, y: 780 },
      { x: 1660, y: 780 },
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
      { x: 600, y: 1000, width: 200, height: 12 },
      { x: 1480, y: 1000, width: 200, height: 12 },
      // mid tier
      { x: 200, y: 900, width: 350, height: 12 },
      { x: 800, y: 880, width: 300, height: 12 },
      { x: 1460, y: 880, width: 300, height: 12 },
      { x: 2010, y: 900, width: 350, height: 12 },
      // upper tier
      { x: 450, y: 730, width: 400, height: 12 },
      { x: 1100, y: 700, width: 360, height: 12 },
      { x: 1710, y: 730, width: 400, height: 12 },
      // top
      { x: 700, y: 550, width: 300, height: 12 },
      { x: 1560, y: 550, width: 300, height: 12 },
      { x: 1080, y: 480, width: 400, height: 12 },
      // walls on islands
      { x: 380, y: 1000, width: 20, height: 100, isWall: true },
      { x: 2160, y: 1000, width: 20, height: 100, isWall: true },
    ],
    spawnPoints: [
      { x: 400, y: 1050 },
      { x: 2160, y: 1050 },
      { x: 1280, y: 1050 },
      { x: 1280, y: 430 },
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
      { x: 300, y: 1550, width: 600, height: 12 },
      { x: 1600, y: 1580, width: 640, height: 12 },
      { x: 2940, y: 1550, width: 600, height: 12 },
      // mid platforms
      { x: 150, y: 1350, width: 500, height: 12 },
      { x: 850, y: 1380, width: 450, height: 12 },
      { x: 1700, y: 1350, width: 440, height: 12 },
      { x: 2540, y: 1380, width: 450, height: 12 },
      { x: 3190, y: 1350, width: 500, height: 12 },
      // upper mid
      { x: 400, y: 1150, width: 500, height: 12 },
      { x: 1200, y: 1180, width: 400, height: 12 },
      { x: 2240, y: 1180, width: 400, height: 12 },
      { x: 2940, y: 1150, width: 500, height: 12 },
      { x: 1650, y: 1100, width: 540, height: 12 },
      // high platforms
      { x: 700, y: 950, width: 500, height: 12 },
      { x: 1550, y: 900, width: 740, height: 12 },
      { x: 2640, y: 950, width: 500, height: 12 },
      // top
      { x: 1200, y: 720, width: 400, height: 12 },
      { x: 2240, y: 720, width: 400, height: 12 },
      { x: 1700, y: 620, width: 440, height: 12 },
      // walls — fortress walls
      { x: 1200, y: 1380, width: 24, height: 370, isWall: true },
      { x: 2616, y: 1380, width: 24, height: 370, isWall: true },
      { x: 1880, y: 1100, width: 24, height: 280, isWall: true },
      { x: 1936, y: 1100, width: 24, height: 280, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 1700 },
      { x: 3340, y: 1700 },
      { x: 1920, y: 1700 },
      { x: 600, y: 1300 },
      { x: 3240, y: 1300 },
      { x: 1920, y: 1050 },
      { x: 1400, y: 670 },
      { x: 2440, y: 670 },
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
      { x: 1600, y: 1900, width: 640, height: 12 },
      { x: 1700, y: 2050, width: 440, height: 12 },
      // lower tier
      { x: 200, y: 1600, width: 500, height: 12 },
      { x: 900, y: 1620, width: 400, height: 12 },
      { x: 2540, y: 1620, width: 400, height: 12 },
      { x: 3140, y: 1600, width: 500, height: 12 },
      // mid tier
      { x: 400, y: 1400, width: 600, height: 12 },
      { x: 1500, y: 1420, width: 840, height: 12 },
      { x: 2840, y: 1400, width: 600, height: 12 },
      // upper tier
      { x: 200, y: 1200, width: 450, height: 12 },
      { x: 850, y: 1170, width: 500, height: 12 },
      { x: 1650, y: 1150, width: 540, height: 12 },
      { x: 2490, y: 1170, width: 500, height: 12 },
      { x: 3190, y: 1200, width: 450, height: 12 },
      // high tier
      { x: 600, y: 980, width: 500, height: 12 },
      { x: 1600, y: 940, width: 640, height: 12 },
      { x: 2740, y: 980, width: 500, height: 12 },
      // top
      { x: 1300, y: 760, width: 500, height: 12 },
      { x: 2040, y: 760, width: 500, height: 12 },
      { x: 1700, y: 600, width: 440, height: 12 },
      // walls around pit
      { x: 1500, y: 1420, width: 24, height: 380, isWall: true },
      { x: 2316, y: 1420, width: 24, height: 380, isWall: true },
    ],
    spawnPoints: [
      { x: 600, y: 1750 },
      { x: 3240, y: 1750 },
      { x: 1920, y: 1850 },
      { x: 400, y: 1350 },
      { x: 3440, y: 1350 },
      { x: 1920, y: 1370 },
      { x: 1100, y: 1120 },
      { x: 2740, y: 1120 },
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
      { x: 200, y: 1600, width: 700, height: 12 },
      { x: 1200, y: 1620, width: 600, height: 12 },
      { x: 2040, y: 1620, width: 600, height: 12 },
      { x: 2940, y: 1600, width: 700, height: 12 },
      // tier 2
      { x: 400, y: 1400, width: 500, height: 12 },
      { x: 1100, y: 1380, width: 500, height: 12 },
      { x: 1800, y: 1400, width: 240, height: 12 },
      { x: 2240, y: 1380, width: 500, height: 12 },
      { x: 2940, y: 1400, width: 500, height: 12 },
      // tier 3
      { x: 200, y: 1180, width: 600, height: 12 },
      { x: 1050, y: 1150, width: 500, height: 12 },
      { x: 1750, y: 1180, width: 340, height: 12 },
      { x: 2290, y: 1150, width: 500, height: 12 },
      { x: 3040, y: 1180, width: 600, height: 12 },
      // tier 4
      { x: 500, y: 960, width: 600, height: 12 },
      { x: 1500, y: 940, width: 840, height: 12 },
      { x: 2740, y: 960, width: 600, height: 12 },
      // top
      { x: 1200, y: 760, width: 500, height: 12 },
      { x: 2140, y: 760, width: 500, height: 12 },
      { x: 1650, y: 620, width: 540, height: 12 },
      // maze walls — many vertical dividers
      { x: 900, y: 1400, width: 20, height: 200, isWall: true },
      { x: 2920, y: 1400, width: 20, height: 200, isWall: true },
      { x: 1560, y: 1180, width: 20, height: 240, isWall: true },
      { x: 2260, y: 1180, width: 20, height: 240, isWall: true },
      { x: 800, y: 1180, width: 20, height: 220, isWall: true },
      { x: 3020, y: 1180, width: 20, height: 220, isWall: true },
      { x: 1480, y: 940, width: 20, height: 240, isWall: true },
      { x: 2360, y: 940, width: 20, height: 240, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 1750 },
      { x: 3340, y: 1750 },
      { x: 1500, y: 1570 },
      { x: 2340, y: 1570 },
      { x: 500, y: 1130 },
      { x: 3340, y: 1130 },
      { x: 1920, y: 890 },
      { x: 1920, y: 570 },
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
      { x: 200, y: 2100, width: 600, height: 12 },
      { x: 1100, y: 2130, width: 500, height: 12 },
      { x: 1900, y: 2100, width: 500, height: 12 },
      { x: 2720, y: 2100, width: 500, height: 12 },
      { x: 3520, y: 2130, width: 500, height: 12 },
      { x: 4320, y: 2100, width: 600, height: 12 },
      // ring 2
      { x: 400, y: 1880, width: 600, height: 12 },
      { x: 1300, y: 1860, width: 500, height: 12 },
      { x: 2160, y: 1880, width: 700, height: 12 },
      { x: 3320, y: 1860, width: 500, height: 12 },
      { x: 4120, y: 1880, width: 600, height: 12 },
      // ring 3
      { x: 200, y: 1650, width: 500, height: 12 },
      { x: 900, y: 1620, width: 600, height: 12 },
      { x: 1800, y: 1640, width: 500, height: 12 },
      { x: 2510, y: 1600, width: 700, height: 12 },
      { x: 3620, y: 1620, width: 600, height: 12 },
      { x: 4420, y: 1650, width: 500, height: 12 },
      // ring 4
      { x: 600, y: 1400, width: 700, height: 12 },
      { x: 1600, y: 1380, width: 600, height: 12 },
      { x: 2360, y: 1350, width: 400, height: 12 },
      { x: 2920, y: 1380, width: 600, height: 12 },
      { x: 3820, y: 1400, width: 700, height: 12 },
      // high tier
      { x: 1000, y: 1160, width: 600, height: 12 },
      { x: 2060, y: 1120, width: 1000, height: 12 },
      { x: 3520, y: 1160, width: 600, height: 12 },
      // top
      { x: 1800, y: 920, width: 600, height: 12 },
      { x: 2720, y: 920, width: 600, height: 12 },
      { x: 2260, y: 760, width: 600, height: 12 },
      // walls — arena pillars
      { x: 1600, y: 1880, width: 24, height: 470, isWall: true },
      { x: 3496, y: 1880, width: 24, height: 470, isWall: true },
      { x: 2360, y: 1350, width: 24, height: 530, isWall: true },
      { x: 2736, y: 1350, width: 24, height: 530, isWall: true },
      { x: 900, y: 1400, width: 24, height: 480, isWall: true },
      { x: 4196, y: 1400, width: 24, height: 480, isWall: true },
    ],
    spawnPoints: [
      { x: 600, y: 2300 },
      { x: 4520, y: 2300 },
      { x: 2560, y: 2300 },
      { x: 1400, y: 2080 },
      { x: 3720, y: 2080 },
      { x: 600, y: 1830 },
      { x: 4520, y: 1830 },
      { x: 2560, y: 1830 },
      { x: 1200, y: 1570 },
      { x: 3920, y: 1570 },
      { x: 2560, y: 1300 },
      { x: 2560, y: 710 },
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
      { x: 1200, y: 2350, width: 700, height: 16 },
      { x: 2210, y: 2400, width: 700, height: 16 },
      { x: 3220, y: 2350, width: 700, height: 16 },
      { x: 4220, y: 2400, width: 800, height: 16 },
      // connectors
      { x: 800, y: 2250, width: 300, height: 12 },
      { x: 1800, y: 2280, width: 300, height: 12 },
      { x: 2810, y: 2280, width: 300, height: 12 },
      { x: 3820, y: 2250, width: 300, height: 12 },
      // mid islands
      { x: 200, y: 2050, width: 600, height: 12 },
      { x: 1050, y: 2020, width: 500, height: 12 },
      { x: 1850, y: 2050, width: 420, height: 12 },
      { x: 2560, y: 2000, width: 600, height: 12 },
      { x: 3460, y: 2050, width: 500, height: 12 },
      { x: 4350, y: 2020, width: 570, height: 12 },
      // upper islands
      { x: 400, y: 1800, width: 500, height: 12 },
      { x: 1200, y: 1760, width: 600, height: 12 },
      { x: 2160, y: 1780, width: 800, height: 12 },
      { x: 3320, y: 1760, width: 600, height: 12 },
      { x: 4220, y: 1800, width: 500, height: 12 },
      // high islands
      { x: 700, y: 1550, width: 500, height: 12 },
      { x: 1600, y: 1520, width: 500, height: 12 },
      { x: 2360, y: 1500, width: 400, height: 12 },
      { x: 3020, y: 1520, width: 500, height: 12 },
      { x: 3920, y: 1550, width: 500, height: 12 },
      // sky platforms
      { x: 1100, y: 1300, width: 600, height: 12 },
      { x: 2060, y: 1250, width: 1000, height: 12 },
      { x: 3420, y: 1300, width: 600, height: 12 },
      // top
      { x: 1800, y: 1050, width: 600, height: 12 },
      { x: 2720, y: 1050, width: 600, height: 12 },
      { x: 2260, y: 880, width: 600, height: 12 },
      // walls on large islands
      { x: 500, y: 2300, width: 20, height: 100, isWall: true },
      { x: 4620, y: 2300, width: 20, height: 100, isWall: true },
      { x: 2210, y: 2300, width: 20, height: 100, isWall: true },
      { x: 2890, y: 2300, width: 20, height: 100, isWall: true },
    ],
    spawnPoints: [
      { x: 500, y: 2350 },
      { x: 4620, y: 2350 },
      { x: 1560, y: 2300 },
      { x: 3560, y: 2300 },
      { x: 2560, y: 2350 },
      { x: 500, y: 2000 },
      { x: 4620, y: 1970 },
      { x: 1500, y: 1710 },
      { x: 3620, y: 1710 },
      { x: 2560, y: 1730 },
      { x: 2560, y: 1200 },
      { x: 2560, y: 830 },
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
      { x: 200, y: 2150, width: 700, height: 12 },
      { x: 1100, y: 2180, width: 500, height: 12 },
      { x: 1900, y: 2150, width: 500, height: 12 },
      { x: 2560, y: 2180, width: 600, height: 12 },
      { x: 3520, y: 2180, width: 500, height: 12 },
      { x: 4220, y: 2150, width: 700, height: 12 },
      // tier 2
      { x: 300, y: 1920, width: 600, height: 12 },
      { x: 1150, y: 1900, width: 500, height: 12 },
      { x: 1900, y: 1920, width: 600, height: 12 },
      { x: 2760, y: 1900, width: 600, height: 12 },
      { x: 3620, y: 1900, width: 500, height: 12 },
      { x: 4220, y: 1920, width: 600, height: 12 },
      // tier 3
      { x: 200, y: 1680, width: 500, height: 12 },
      { x: 900, y: 1650, width: 600, height: 12 },
      { x: 1800, y: 1680, width: 600, height: 12 },
      { x: 2720, y: 1650, width: 600, height: 12 },
      { x: 3620, y: 1650, width: 600, height: 12 },
      { x: 4420, y: 1680, width: 500, height: 12 },
      // tier 4
      { x: 500, y: 1450, width: 700, height: 12 },
      { x: 1500, y: 1420, width: 700, height: 12 },
      { x: 2420, y: 1400, width: 280, height: 12 },
      { x: 2920, y: 1420, width: 700, height: 12 },
      { x: 3920, y: 1450, width: 700, height: 12 },
      // high tier
      { x: 800, y: 1220, width: 600, height: 12 },
      { x: 1700, y: 1180, width: 700, height: 12 },
      { x: 2720, y: 1180, width: 700, height: 12 },
      { x: 3720, y: 1220, width: 600, height: 12 },
      // top
      { x: 1400, y: 980, width: 600, height: 12 },
      { x: 2260, y: 940, width: 600, height: 12 },
      { x: 3120, y: 980, width: 600, height: 12 },
      { x: 2160, y: 780, width: 800, height: 12 },
      // walls — bunker dividers (many)
      { x: 1300, y: 2150, width: 24, height: 250, isWall: true },
      { x: 3796, y: 2150, width: 24, height: 250, isWall: true },
      { x: 1850, y: 1920, width: 24, height: 230, isWall: true },
      { x: 3246, y: 1920, width: 24, height: 230, isWall: true },
      { x: 700, y: 1680, width: 24, height: 240, isWall: true },
      { x: 4396, y: 1680, width: 24, height: 240, isWall: true },
      { x: 1500, y: 1420, width: 24, height: 260, isWall: true },
      { x: 3596, y: 1420, width: 24, height: 260, isWall: true },
      { x: 2400, y: 1400, width: 24, height: 280, isWall: true },
      { x: 2696, y: 1400, width: 24, height: 280, isWall: true },
    ],
    spawnPoints: [
      { x: 600, y: 2350 },
      { x: 4520, y: 2350 },
      { x: 2560, y: 2350 },
      { x: 1360, y: 2130 },
      { x: 3760, y: 2130 },
      { x: 600, y: 1870 },
      { x: 4520, y: 1870 },
      { x: 2060, y: 1870 },
      { x: 3060, y: 1870 },
      { x: 1200, y: 1600 },
      { x: 3920, y: 1600 },
      { x: 2560, y: 730 },
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
