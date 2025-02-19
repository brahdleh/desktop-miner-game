export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BLOCK_SIZE = 36
export const PLAYER_WIDTH = 25
export const PLAYER_HEIGHT = 60
export const GRAVITY = 0.5
export const JUMP_STRENGTH = 10
export const MOVE_SPEED = 3
export const MINE_WIDTH = 9
export const MINE_LEFT = 7 * BLOCK_SIZE //(CANVAS_WIDTH - MINE_WIDTH * BLOCK_SIZE) / 2
export const SURFACE_Y = 5 * BLOCK_SIZE

// Mining constants
export const PICKAXE_BASE_COST = 10
export const PICKAXE_MINE_INCREMENT = 1.5
export const PICKAXE_COST_MULTIPLIER = 2
export const DEFAULT_MINE_TIME = 2000
export const MAX_PICKAXE_LEVEL = 3

// Backpack constants
export const BACKPACK_CAPACITY_INCREMENT = 2
export const BACKPACK_BASE_COST = 10
export const BACKPACK_COST_MULTIPLIER = 2
export const MAX_BACKPACK_LEVEL = 3
// Mine dimensions
export const MINE_DEPTH_BLOCKS = 300
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

// Block type definitions
export const BLOCK_TYPES = {
  GRASS: {
    id: 0,
    value: 1,
    color: "#228B22",
    miningTimeMultiplier: 0.5,
    density: 1,
    name: "Grass",
    solid: true,
    climbable: false
  },
  STONE: {
    id: 1,
    value: 1,
    color: "#808080",
    miningTimeMultiplier: 1,
    density: 1,
    name: "Stone",
    solid: true,
    climbable: false
  },
  SLATE: {
    id: 2,
    value: 5,
    color: "#3A3B3C",
    miningTimeMultiplier: 5,
    density: 5,
    name: "Slate",
    solid: true,
    climbable: false

  },
  MAGMA: {
    id: 3,
    value: 20,
    color: "#380000",
    miningTimeMultiplier: 20,
    density: 20,
    name: "Magma",
    solid: true,
    climbable: false

  },
  BEDROCK: {
    id: 4,
    value: 100,
    color: "#101111",
    miningTimeMultiplier: 100,
    density: 100,
    name: "Bedrock",
    solid: true,
    climbable: false

  },
  COPPER: {
    id: 5,
    value: 20,
    color: "#D16002",
    miningTimeMultiplier: 5,
    density: 1,
    name: "Copper",
    solid: true,
    climbable: false

  },
  IRON: {
    id: 6,
    value: 50,
    color: "#A2A4A4",
    miningTimeMultiplier: 30,
    density: 1,
    name: "Iron",
    solid: true,
    climbable: false

  },
  GOLD: {
    id: 7,
    value: 100,
    color: "#FCAE1E",
    miningTimeMultiplier: 100,
    density: 1,
    name: "Gold",
    solid: true,
    climbable: false

  },
  DIAMOND: {
    id: 8,
    value: 1000,
    color: "#4EE2EC",
    miningTimeMultiplier: 300,
    density: 1,
    name: "Diamond",
    solid: true,
    climbable: false

  },
  UNAMED: {
    id: 9,
    value: 1000,
    color: "#4EE2EC",
    miningTimeMultiplier: 300,
    density: 1,
    name: "Unamed",
    solid: true,
    climbable: false

  },
  PLATFORM: {
    id: 10,
    value: 1,
    color: "#4EE2EC",
    miningTimeMultiplier: 0.5,
    density: 1,
    name: "Platform",
    solid: true,
    climbable: false
  },
  LADDER: {
    id: 11,
    value: 1,
    color: "#4EE2EC",
    miningTimeMultiplier: 0.5,
    density: 1,
    name: "Ladder",
    solid: false,
    climbable: true
  },
  TORCH: {
    id: 12,
    value: 1,
    color: "#4EE2EC",
    miningTimeMultiplier: 0.5,
    density: 1,
    name: "Torch",
    solid: false,
    climbable: false
  },
  UNAMED2: {
    id: 13,
    value: 1000,
    color: "#4EE2EC",
    miningTimeMultiplier: 300,
    density: 1,
    name: "Unamed2",
    solid: true,
    climbable: false
  },
  REFINER: {
    id: 14,
    value: 1,
    color: "#6B4423",
    miningTimeMultiplier: 1,
    density: 1,
    name: "Refiner",
    solid: false,
    climbable: false
  },
  POLISHED_STONE: {
    id: 15,
    value: 3, // 3x value of stone
    color: "#A0A0A0", // Lighter gray
    miningTimeMultiplier: 1,
    density: 1,
    name: "Polished Stone",
    solid: true,
    climbable: false
  },
  POLISHED_SLATE: {
    id: 16,
    value: 15, // 3x value of slate
    color: "#4A4B4C", // Lighter slate
    miningTimeMultiplier: 5,
    density: 5,
    name: "Polished Slate",
    solid: true,
    climbable: false
  },
  POLISHED_MAGMA: {
    id: 17,
    value: 60, // 3x value of magma
    color: "#581010", // Lighter magma
    miningTimeMultiplier: 20,
    density: 20,
    name: "Polished Magma",
    solid: true,
    climbable: false
  },
  POLISHED_BEDROCK: {
    id: 18,
    value: 300, // 3x value of bedrock
    color: "#202222", // Lighter bedrock
    miningTimeMultiplier: 100,
    density: 100,
    name: "Polished Bedrock",
    solid: true,
    climbable: false
  },
  UNAMED3: {
    id: 13,
    value: 1000,
    color: "#4EE2EC",
    miningTimeMultiplier: 300,
    density: 1,
    name: "Unamed3",
    solid: true,
    climbable: false
  }
} as const 

// Pickaxe types
export const PICKAXE_TYPES = {
  STONE: {
    id: 0,
    miningTimeMultiplier: 1,
    name: "Stone",
    requirements: null,  // Starting pickaxe
    upgradeCostMultiplier: 1
  },
  COPPER: {
    id: 1,
    miningTimeMultiplier: 4,
    name: "Copper",
    requirements: {
      blockType: 5,
      amount: 5
    },
    upgradeCostMultiplier: 5
  },
  IRON: {
    id: 2,
    miningTimeMultiplier: 16,
    name: "Iron",
    requirements: {
      blockType: 6,
      amount: 5
    },
    upgradeCostMultiplier: 20
  },
  GOLD: {
    id: 3,
    miningTimeMultiplier: 64,
    name: "Gold",
    requirements: {
      blockType: 7,
      amount: 5
    },
    upgradeCostMultiplier: 75
  },
  DIAMOND: {
    id: 5,
    miningTimeMultiplier: 256,
    name: "Diamond",
    requirements: {
      blockType: 8,
      amount: 5
    },
    upgradeCostMultiplier: 200
  }
} as const

// Backpack types
export const BACKPACK_TYPES = {
  STONE: {
    id: 0,
    capacity: 5,
    name: "Stone",
    requirements: null,
    upgradeCostMultiplier: 1
  },
  COPPER: {
    id: 1,
    capacity: 50,
    name: "Copper",
    requirements: {
      blockType: 5,
      amount: 5
    },
    upgradeCostMultiplier: 5
  },
  IRON: {
    id: 2,
    capacity: 500,
    name: "Iron",
    requirements: {
      blockType: 6,
      amount: 5
    },
    upgradeCostMultiplier: 20
  },
  GOLD: {
    id: 3,
    capacity: 5000,
    name: "Gold",
    requirements: {
      blockType: 7,
      amount: 5
    },
    upgradeCostMultiplier: 75
  },
  DIAMOND: {
    id: 5,
    capacity: 50000,
    name: "Diamond",
    requirements: {
      blockType: 8,
      amount: 5
    },
    upgradeCostMultiplier: 200
  }
} as const

// Create reverse lookup from ID to block type name
export const BLOCK_ID_TO_TYPE = Object.fromEntries(
  Object.entries(BLOCK_TYPES).map(([name, data]) => [data.id, name])
) as { [id: number]: keyof typeof BLOCK_TYPES }

// Refining constants
export const REFINING_TIME = 100000 // 100 seconds to refine a block
export const REFINABLE_BLOCKS = {
  1: 15,  // Stone -> Polished Stone
  2: 16,  // Slate -> Polished Slate
  3: 17,  // Magma -> Polished Magma
  4: 18   // Bedrock -> Polished Bedrock
} as const

