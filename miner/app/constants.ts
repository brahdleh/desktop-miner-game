export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BLOCK_SIZE = 40
export const PLAYER_WIDTH = 30
export const PLAYER_HEIGHT = 60
export const GRAVITY = 0.5
export const TERMINAL_VELOCITY = 15
export const JUMP_STRENGTH = 10
export const MOVE_SPEED = 3
export const MINE_WIDTH = 9
export const MINE_LEFT = 6 * BLOCK_SIZE //(CANVAS_WIDTH - MINE_WIDTH * BLOCK_SIZE) / 2
export const SURFACE_Y = 5 * BLOCK_SIZE

// Mining constants
// Intend 3 upgrades (3.33x per phase, with 3x from tools that is 10x mining and capacity)
export const PROFICIENCY_BASE_COST = 10
export const PICKAXE_MINE_INCREMENT = 1.494
export const PROFICIENCY_COST_MULTIPLIER = 4
export const DEFAULT_MINE_TIME = 1500
export const MAX_PROFICIENCY_LEVEL = 10
export const MINING_REACH = BLOCK_SIZE * 1.75

// Backpack constants
export const BACKPACK_CAPACITY_INCREMENT = 1.494
export const STRENGTH_BASE_COST = 10
export const STRENGTH_COST_MULTIPLIER = 4
export const MAX_STRENGTH_LEVEL = 10
// Mine dimensions
export const MINE_DEPTH_BLOCKS = 150
export const MINE_DEPTH_PX = MINE_DEPTH_BLOCKS * BLOCK_SIZE

// Automation constants
export const MACHINE_STORAGE_LIMIT = 9 // Maximum items a machine can store
export const MACHINE_INTERACTION_DISTANCE = BLOCK_SIZE // Distance in pixels for interacting with machines

// Action zones
export const UPGRADE_ZONE = {
  x: 0,
  y: SURFACE_Y - 250,
  width: 230,
  height: 75,
}

export const CRAFT_ZONE = {
  x: CANVAS_WIDTH - 190,
  y: SURFACE_Y - 250,
  width: 190,
  height: 75,
}

// Base block properties that most blocks share
const DEFAULT_BLOCK = {
  solid: true,
  climbable: false,
  requirements: null,
  size: [1, 1],
} as const

// Block type definitions
export const BLOCK_TYPES = {
  // Natural blocks (organized by depth/hardness)
  GRASS: { id: 0, value: 1, miningTimeMultiplier: 0.5, density: 1, name: "Grass", category: 'dirt', ...DEFAULT_BLOCK },
  STONE: { id: 1, value: 1, miningTimeMultiplier: 1, density: 1, name: "Stone", category: 'block', ...DEFAULT_BLOCK },
  SLATE: { id: 2, value: 10, miningTimeMultiplier: 10, density: 10, name: "Slate", category: 'block',...DEFAULT_BLOCK },
  MAGMA: { id: 3, value: 100, miningTimeMultiplier: 100, density: 100, name: "Magma", category: 'block', ...DEFAULT_BLOCK },
  BEDROCK: { id: 4, value: 1000, miningTimeMultiplier: 1000, density: 1000, name: "Bedrock", category: 'block', ...DEFAULT_BLOCK },

  // Ores
  COPPER: { id: 5, value: 10, miningTimeMultiplier: 4, density: 1, name: "Copper", category: 'ore', ...DEFAULT_BLOCK },
  IRON: { id: 6, value: 100, miningTimeMultiplier: 40, density: 1, name: "Iron", category: 'ore', ...DEFAULT_BLOCK },
  GOLD: { id: 7, value: 1000, miningTimeMultiplier: 400, density: 1, name: "Gold", category: 'ore', ...DEFAULT_BLOCK },
  DIAMOND: { id: 8, value: 10000, miningTimeMultiplier: 4000, density: 1, name: "Diamond", category: 'ore', ...DEFAULT_BLOCK },
  UNAMED: { id: 9, value: 1000, miningTimeMultiplier: 300, density: 1, name: "Unamed", category: 'ore', ...DEFAULT_BLOCK },

  // Mine Equipment
  PLATFORM: { id: 10, value: 3, miningTimeMultiplier: 1, density: 1, name: "Platform", category: 'platform', ...DEFAULT_BLOCK },
  LADDER: { id: 11, value: 10, miningTimeMultiplier: 1, density: 1, name: "Ladder", category: 'ladder', solid: false, climbable: true, requirements: null },
  TORCH: { id: 12, value: 5, miningTimeMultiplier: 1, density: 1, name: "Torch", category: 'torch', solid: false, climbable: false, requirements: null },
  UNAMED2: { id: 13, value: 1000, miningTimeMultiplier: 300, density: 1, name: "Unamed2", category: 'unamed', ...DEFAULT_BLOCK },
  REFINER: { id: 14, value: 50, miningTimeMultiplier: 5, density: 1, name: "Refiner", solid: false, climbable: false, requirements: null, size: [3, 2], category: 'refiner' },

  // Polished variants (value = 5x base)
  POLISHED_STONE: { id: 15, value: 5, miningTimeMultiplier: 1, density: 1, name: "Polished Stone", category: 'polished', ...DEFAULT_BLOCK },
  POLISHED_SLATE: { id: 16, value: 50, miningTimeMultiplier: 10, density: 10, name: "Polished Slate", category: 'polished', ...DEFAULT_BLOCK },
  POLISHED_MAGMA: { id: 17, value: 500, miningTimeMultiplier: 100, density: 100, name: "Polished Magma", category: 'polished', ...DEFAULT_BLOCK },
  POLISHED_BEDROCK: { id: 18, value: 5000, miningTimeMultiplier: 1000, density: 1000, name: "Polished Bedrock", category: 'polished', ...DEFAULT_BLOCK },

  // Automation Machinery
  COLLECTOR: { id: 19, value: 100, miningTimeMultiplier: 3, density: 1, name: "Collector", category: 'collector', solid: false, climbable: false, requirements: null, size: [1, 1] },
  CHEST: { id: 20, value: 150, miningTimeMultiplier: 3, density: 1, name: "Chest", category: 'chest', solid: false, climbable: false, requirements: null, size: [1, 1] },
  TUBE: { id: 21, value: 50, miningTimeMultiplier: 0.5, density: 1, name: "Tube", category: 'tube', solid: false, climbable: false, requirements: null, size: [1, 1] },
  COPPER_REFINER: { id: 22, value: 110, miningTimeMultiplier: 10, density: 1, name: "Copper Refiner", solid: false, climbable: false, requirements: {
      blockType: 5, // Copper
      amount: 1,
      base: 14 // Stone refiner required
    }, size: [3, 2], category: 'refiner' 
  },
  IRON_REFINER: { id: 23, value: 200, miningTimeMultiplier: 20, density: 1, name: "Iron Refiner", solid: false, climbable: false, requirements: {
      blockType: 6, // Iron
      amount: 1,
      base: 22 // Copper refiner required
    }, size: [3, 2], category: 'refiner' 
  },
  GOLD_REFINER: { id: 24, value: 1100, miningTimeMultiplier: 40, density: 1, name: "Gold Refiner", solid: false, climbable: false, requirements: {
      blockType: 7, // Gold
      amount: 1,
      base: 23 // Iron refiner required
    }, size: [3, 2], category: 'refiner' 
  },
  DIAMOND_REFINER: { id: 25, value: 10100, miningTimeMultiplier: 80, density: 1, name: "Diamond Refiner", solid: false, climbable: false, requirements: {
      blockType: 8, // Diamond
      amount: 1,
      base: 24 // Gold refiner required
    }, size: [3, 2], category: 'refiner' 
  },

  // Upgraded ladders
  STONE_LADDER: { id: 26, value: 15, miningTimeMultiplier: 1, density: 1, name: "Stone Ladder", category: 'ladder', solid: false, climbable: true, requirements: {
      blockType: 15, // Polished Stone
      amount: 1,
      base: 11 // Ladder required
    } },
  SLATE_LADDER: { id: 27, value: 60, miningTimeMultiplier: 5, density: 10, name: "Slate Ladder", category: 'ladder', solid: false, climbable: true, requirements: {
      blockType: 16, // Polished Slate
      amount: 1,
      base: 11 // Ladder required
    } },
  MAGMA_LADDER: { id: 28, value: 110, miningTimeMultiplier: 50, density: 100, name: "Magma Ladder", category: 'ladder', solid: false, climbable: true, requirements: {
      blockType: 17, // Polished Magma
      amount: 1,
      base: 11 // Ladder required
    } },
  BEDROCK_LADDER: { id: 29, value: 1010, miningTimeMultiplier: 500, density: 1000, name: "Bedrock Ladder", category: 'ladder', solid: false, climbable: true, requirements: {
      blockType: 18, // Polished Bedrock
      amount: 1,
      base: 11 // Ladder required
    } },
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
      amount: 3
    },
  },
  IRON: {
    id: 2, miningTimeMultiplier: 9, name: "Iron",
    requirements: {
      blockType: 6,
      amount: 3
    },
  },
  GOLD: {
    id: 3, miningTimeMultiplier: 27, name: "Gold",
    requirements: {
      blockType: 7,
      amount: 3
    },
  },
  DIAMOND: {
    id: 4, miningTimeMultiplier: 81, name: "Diamond",
    requirements: {
      blockType: 8,
      amount: 3
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
      amount: 3
    },
  },
  IRON: {
    id: 2, capacity: 45, name: "Iron",
    requirements: {
      blockType: 6,
      amount: 3
    },
  },
  GOLD: {
    id: 3, capacity: 135, name: "Gold",
    requirements: {
      blockType: 7,
      amount: 3
    },
  },
  DIAMOND: {
    id: 4, capacity: 405, name: "Diamond",
    requirements: {
      blockType: 8,
      amount: 3
    },
  }
} as const

// Refining constants
export const REFINING_TIME = 30000 // 30 seconds to refine a block
export const REFINABLE_BLOCKS = {
  1: 15,  // Stone -> Polished Stone
  2: 16,  // Slate -> Polished Slate
  3: 17,  // Magma -> Polished Magma
  4: 18   // Bedrock -> Polished Bedrock
} as const


