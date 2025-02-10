export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BLOCK_SIZE = 40
export const PLAYER_WIDTH = 25
export const PLAYER_HEIGHT = 60
export const GRAVITY = 0.5
export const JUMP_STRENGTH = 10
export const MOVE_SPEED = 3
export const MINE_WIDTH = 8
export const MINE_LEFT = (CANVAS_WIDTH - MINE_WIDTH * BLOCK_SIZE) / 2
export const SURFACE_Y = 5 * BLOCK_SIZE

// Mining constants
export const PICKAXE_BASE_COST = 1
export const PICKAXE_MINE_INCREMENT = 1.5
export const PICKAXE_COST_MULTIPLIER = 2
export const DEFAULT_MINE_TIME = 100
export const MAX_PICKAXE_LEVEL = 3

// Backpack constants
export const BACKPACK_CAPACITY_INCREMENT = 2
export const BACKPACK_BASE_COST = 1
export const BACKPACK_COST_MULTIPLIER = 2
export const MAX_BACKPACK_LEVEL = 3
// Mine dimensions
export const MINE_DEPTH_BLOCKS = 100
export const MINE_DEPTH_PX = MINE_DEPTH_BLOCKS * BLOCK_SIZE

// Action zones
export const UPGRADE_ZONE = {
  x: 0,
  y: SURFACE_Y - 170,
  width: 120,
  height: 170,
}

export const CRAFT_ZONE = {
  x: CANVAS_WIDTH - 160,
y: SURFACE_Y - 170,
  width: 160,
  height: 170,
}

// Block type definitions
export const BLOCK_TYPES = {
  GRASS: {
    id: 0,
    value: 1,
    color: "#228B22",
    miningTimeMultiplier: 1,
    name: "Grass"
  },
  STONE: {
    id: 1,
    value: 1,
    color: "#808080",
    miningTimeMultiplier: 1,
    name: "Stone"
  },
  DENSE: {
    id: 2,
    value: 3,
    color: "#3A3B3C",
    miningTimeMultiplier: 2,
    name: "Dense"
  },
  MAGMA: {
    id: 3,
    value: 8,
    color: "#380000",
    miningTimeMultiplier: 5,
    name: "Magma"
  },
  BEDROCK: {
    id: 4,
    value: 20,
    color: "#101111",
    miningTimeMultiplier: 15,
    name: "Bedrock"
  },
  COPPER: {
    id: 5,
    value: 10,
    color: "#D16002",
    miningTimeMultiplier: 10,
    name: "Copper"
  },
  IRON: {
    id: 6,
    value: 20,
    color: "#A2A4A4",
    miningTimeMultiplier: 15,
    name: "Iron"
  },
  GOLD: {
    id: 7,
    value: 30,
    color: "#FCAE1E",
    miningTimeMultiplier: 20,
    name: "Gold"
  },
  EMERALD: {
    id: 8,
    value: 40,
    color: "#50C878",
    miningTimeMultiplier: 30,
    name: "Emerald"
  },
  DIAMOND: {
    id: 9,
    value: 50,
    color: "#4EE2EC",
    miningTimeMultiplier: 40,
    name: "Diamond"
  }
} as const 

// Pickaxe types
export const PICKAXE_TYPES = {
  STONE: {
    id: 0,
    miningTimeMultiplier: 1,
    name: "Stone",
    requirements: null  // Starting pickaxe
  },
  COPPER: {
    id: 1,
    miningTimeMultiplier: 2,
    name: "Copper",
    requirements: {
      blockType: 5,  // Copper blocks
      amount: 1
    }
  },
  IRON: {
    id: 2,
    miningTimeMultiplier: 4,
    name: "Iron",
    requirements: {
      blockType: 6,  // Iron blocks
      amount: 1
    }
  },
  GOLD: {
    id: 3,
    miningTimeMultiplier: 8,
    name: "Gold",
    requirements: {
      blockType: 7,  // Gold blocks
      amount: 1
    }
  },
  EMERALD: {
    id: 4,
    miningTimeMultiplier: 16,
    name: "Emerald",
    requirements: {
      blockType: 8,  // Emerald blocks
      amount: 1
    }
  },
  DIAMOND: {
    id: 5,
    miningTimeMultiplier: 32,
    name: "Diamond",
    requirements: {
      blockType: 9,  // Diamond blocks
      amount: 1
    }
  }
} as const 

// Backpack types
export const BACKPACK_TYPES = {
  STONE: {
    id: 0,
    capacity: 20,
    name: "Stone",
    requirements: null
  },
  COPPER: {
    id: 1,
    capacity: 100,
    name: "Copper",
    requirements: {
      blockType: 5,  // Copper blocks
      amount: 1
    }
  },
  IRON: {
    id: 2,
    capacity: 500,
    name: "Iron",
    requirements: {
      blockType: 6,  // Iron blocks
      amount: 1
    }
  },
  GOLD: {
    id: 3,
    capacity: 2500,
    name: "Gold",
    requirements: {
      blockType: 7,  // Gold blocks
      amount: 1
    }
  },
  EMERALD: {
    id: 4,
    capacity: 15000,
    name: "Emerald",
    requirements: {
      blockType: 8,  // Emerald blocks
      amount: 1
      }
    },
  DIAMOND: {
    id: 5,
    capacity: 100000,
    name: "Diamond",
    requirements: {
      blockType: 9,  // Diamond blocks
      amount: 1
    }
  }
} as const 

