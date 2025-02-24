export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BLOCK_SIZE = 36
export const PLAYER_WIDTH = 30
export const PLAYER_HEIGHT = 60
export const GRAVITY = 0.5
export const JUMP_STRENGTH = 10
export const MOVE_SPEED = 3
export const MINE_WIDTH = 9
export const MINE_LEFT = 7 * BLOCK_SIZE //(CANVAS_WIDTH - MINE_WIDTH * BLOCK_SIZE) / 2
export const SURFACE_Y = 5 * BLOCK_SIZE

// Mining constants
// Intend 3 upgrades (3.33x per phase, with 3x from tools that is 10x mining and capacity)
export const PROFICIENCY_BASE_COST = 10
export const PICKAXE_MINE_INCREMENT = 1.494
export const PROFICIENCY_COST_MULTIPLIER = 4
export const DEFAULT_MINE_TIME = 1500
export const MAX_PROFICIENCY_LEVEL = 10

// Backpack constants
export const BACKPACK_CAPACITY_INCREMENT = 1.494
export const STRENGTH_BASE_COST = 10
export const STRENGTH_COST_MULTIPLIER = 4
export const MAX_STRENGTH_LEVEL = 10
// Mine dimensions
export const MINE_DEPTH_BLOCKS = 150
export const MINE_DEPTH_PX = MINE_DEPTH_BLOCKS * BLOCK_SIZE

// Action zones
export const UPGRADE_ZONE = {
  x: 0,
  y: SURFACE_Y - 250,
  width: 230,
  height: 250,
}

export const CRAFT_ZONE = {
  x: CANVAS_WIDTH - 160,
y: SURFACE_Y - 250,
  width: 160,
  height: 250,
}

// Base block properties that most blocks share
const DEFAULT_BLOCK = {
  solid: true,
  climbable: false,
  requirements: null,
} as const

// Block type definitions
export const BLOCK_TYPES = {
  // Natural blocks (organized by depth/hardness)
  GRASS: { id: 0, value: 1, miningTimeMultiplier: 0.5, density: 1, name: "Grass", ...DEFAULT_BLOCK },
  STONE: { id: 1, value: 1, miningTimeMultiplier: 1, density: 1, name: "Stone", ...DEFAULT_BLOCK },
  SLATE: { id: 2, value: 10, miningTimeMultiplier: 10, density: 10, name: "Slate", ...DEFAULT_BLOCK },
  MAGMA: { id: 3, value: 100, miningTimeMultiplier: 100, density: 100, name: "Magma", ...DEFAULT_BLOCK },
  BEDROCK: { id: 4, value: 1000, miningTimeMultiplier: 1000, density: 1000, name: "Bedrock", ...DEFAULT_BLOCK },

  // Ores
  COPPER: { id: 5, value: 20, miningTimeMultiplier: 4, density: 1, name: "Copper", ...DEFAULT_BLOCK },
  IRON: { id: 6, value: 50, miningTimeMultiplier: 40, density: 1, name: "Iron", ...DEFAULT_BLOCK },
  GOLD: { id: 7, value: 100, miningTimeMultiplier: 400, density: 1, name: "Gold", ...DEFAULT_BLOCK },
  DIAMOND: { id: 8, value: 1000, miningTimeMultiplier: 4000, density: 1, name: "Diamond", ...DEFAULT_BLOCK },
  UNAMED: { id: 9, value: 1000, miningTimeMultiplier: 300, density: 1, name: "Unamed", ...DEFAULT_BLOCK },

  // Mine Equipment
  PLATFORM: { id: 10, value: 3, miningTimeMultiplier: 1, density: 1, name: "Platform", ...DEFAULT_BLOCK },
  LADDER: { id: 11, value: 10, miningTimeMultiplier: 1, density: 1, name: "Ladder", solid: false, climbable: true, requirements: null },
  TORCH: { id: 12, value: 5, miningTimeMultiplier: 1, density: 1, name: "Torch", solid: false, climbable: false, requirements: null },
  UNAMED2: { id: 13, value: 1000, miningTimeMultiplier: 300, density: 1, name: "Unamed2", ...DEFAULT_BLOCK },
  REFINER: { id: 14, value: 100, miningTimeMultiplier: 5, density: 1, name: "Refiner", solid: false, climbable: false, requirements: null, size: [3, 2] },

  // Polished variants (value = 5x base)
  POLISHED_STONE: { id: 15, value: 5, miningTimeMultiplier: 1, density: 1, name: "Polished Stone", ...DEFAULT_BLOCK },
  POLISHED_SLATE: { id: 16, value: 50, miningTimeMultiplier: 10, density: 10, name: "Polished Slate", ...DEFAULT_BLOCK },
  POLISHED_MAGMA: { id: 17, value: 500, miningTimeMultiplier: 100, density: 100, name: "Polished Magma", ...DEFAULT_BLOCK },
  POLISHED_BEDROCK: { id: 18, value: 5000, miningTimeMultiplier: 1000, density: 1000, name: "Polished Bedrock", ...DEFAULT_BLOCK },
} as const

// Pickaxe types
export const PICKAXE_TYPES = {
  STONE: {
    id: 0, miningTimeMultiplier: 1, name: "Stone", requirements: null,
  },
  COPPER: {
    id: 1, miningTimeMultiplier: 3, name: "Copper", 
    requirements: {
      blockType: 5,
      amount: 5
    },
  },
  IRON: {
    id: 2, miningTimeMultiplier: 9, name: "Iron",
    requirements: {
      blockType: 6,
      amount: 5
    },
  },
  GOLD: {
    id: 3, miningTimeMultiplier: 27, name: "Gold",
    requirements: {
      blockType: 7,
      amount: 5
    },
  },
  DIAMOND: {
    id: 5, miningTimeMultiplier: 81, name: "Diamond",
    requirements: {
      blockType: 8,
      amount: 5
    },
  }
} as const

// Backpack types
export const BACKPACK_TYPES = {
  STONE: {
    id: 0, capacity: 5, name: "Stone", requirements: null,
  },
  COPPER: {
    id: 1, capacity: 15, name: "Copper",
    requirements: {
      blockType: 5,
      amount: 5
    },
  },
  IRON: {
    id: 2, capacity: 45, name: "Iron",
    requirements: {
      blockType: 6,
      amount: 5
    },
  },
  GOLD: {
    id: 3, capacity: 135, name: "Gold",
    requirements: {
      blockType: 7,
      amount: 5
    },
  },
  DIAMOND: {
    id: 5, capacity: 405, name: "Diamond",
    requirements: {
      blockType: 8,
      amount: 5
    },
  }
} as const

// Create reverse lookup from ID to block type name
export const BLOCK_ID_TO_TYPE = Object.fromEntries(
  Object.entries(BLOCK_TYPES).map(([name, data]) => [data.id, name])
) as { [id: number]: keyof typeof BLOCK_TYPES }

// Refining constants
export const REFINING_TIME = 30000 // 30 seconds to refine a block
export const REFINABLE_BLOCKS = {
  1: 15,  // Stone -> Polished Stone
  2: 16,  // Slate -> Polished Slate
  3: 17,  // Magma -> Polished Magma
  4: 18   // Bedrock -> Polished Bedrock
} as const

