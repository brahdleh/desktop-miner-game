import { BlockType, Block } from './types'
import {
  CANVAS_WIDTH, 
  BLOCK_SIZE, 
  SURFACE_Y,
  MINE_LEFT, 
  MINE_WIDTH, 
  MINE_DEPTH_PX,
  BLOCK_TYPES,
  BACKPACK_TYPES,
} from './constants'
import { BLOCK_DEFINITIONS } from './blockConfig'
import { normalDistribution } from './utils'

// Helper function for normal distribution probability
function normalDistribution(depth: number, mean: number, std: number): number {
  const exp = -0.5 * Math.pow((depth - mean) / std, 2);
  return Math.exp(exp);
}

export function initializeBlocks(): Block[] {
  const blocks: Block[] = []

  // Generate top "grass" platform
  for (let x = 0; x < CANVAS_WIDTH; x += BLOCK_SIZE) {
    blocks.push(createBlock(x, SURFACE_Y, BlockType.GRASS, {
      mineable: x >= MINE_LEFT && x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE
    }))
  }

  // Generate mine shaft
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      const depth = (y - SURFACE_Y) / BLOCK_SIZE
      const block = generateBlockForDepth(x, y, depth)
      blocks.push(block)
    }
  }

  return blocks
}

function createBlock(x: number, y: number, type: BlockType, options: Partial<Block> = {}): Block {
  const definition = BLOCK_DEFINITIONS[type]
  return {
    x,
    y,
    blockType: type,
    isMined: false,
    mineable: true,
    value: definition.value,
    solid: definition.solid,
    climbable: definition.climbable,
    ...options
  }
}

function generateBlockForDepth(x: number, y: number, depth: number): Block {
  const random = Math.random()
  
  // Check each ore type in reverse order (most valuable first)
  for (const [type, definition] of Object.entries(BLOCK_DEFINITIONS)) {
    if (definition.distribution && definition.minDepth) {
      if (depth >= definition.minDepth && 
          random < definition.distribution.maxProb * 
          normalDistribution(depth, definition.distribution.mean, definition.distribution.std)) {
        return createBlock(x, y, Number(type) as BlockType)
      }
    }
  }

  // If no ore was selected, use appropriate base block for depth
  let baseType = BlockType.DIRT
  if (depth > 75) baseType = BlockType.BEDROCK
  else if (depth > 50) baseType = BlockType.MAGMA
  else if (depth > 25) baseType = BlockType.SLATE

  return createBlock(x, y, baseType)
}

export function initializePlayer() {
  return {
    x: CANVAS_WIDTH / 2 - 25/2,
    y: SURFACE_Y - 60,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    onClimbable: false,
    inventory: 0,
    gold: 0,
    pickaxeLevel: 1,
    backpackLevel: 1,
    backpackCapacity: BACKPACK_TYPES.STONE.capacity,
    blockInventory: Object.keys(BLOCK_TYPES).map(() => 0),  // Initialize one slot for each block type
    selectedSlot: 0,
    backpackType: 0,
    pickaxeType: 0
  }
} 