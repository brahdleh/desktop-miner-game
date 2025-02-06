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
export const PICKAXE_COST_MULTIPLIER = 2
export const DEFAULT_MINE_TIME = 2000

// Backpack constants
export const BASE_BACKPACK_CAPACITY = 5
export const BACKPACK_CAPACITY_INCREMENT = 2
export const BACKPACK_BASE_COST = 1
export const BACKPACK_COST_MULTIPLIER = 2

// Mine dimensions
export const MINE_DEPTH_BLOCKS = 50
export const MINE_DEPTH_PX = MINE_DEPTH_BLOCKS * BLOCK_SIZE

// Action zones
export const UPGRADE_ZONE = {
  x: 0,
  y: SURFACE_Y - 150,
  width: 100,
  height: 150,
}

export const SELL_ZONE = {
  x: CANVAS_WIDTH - 100,
  y: SURFACE_Y - 150,
  width: 100,
  height: 150,
} 