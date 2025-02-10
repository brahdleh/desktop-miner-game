import { Block } from './types'
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

export function initializeBlocks(): Block[] {
  const blocks: Block[] = []

  // Generate top "grass" platform
  for (let x = 0; x < CANVAS_WIDTH; x += BLOCK_SIZE) {
    blocks.push({
      x,
      y: SURFACE_Y,
      isMined: false,
      mineable: x >= MINE_LEFT && x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE,
      blockType: 0,
      value: 1
    })
  }

  // Generate mine shaft
  let n = 0
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      n++
      const depth = (y - SURFACE_Y) / BLOCK_SIZE
      var blockType = depth > 75 ? 4 : depth > 50 ? 3 : depth > 25 ? 2 : 1  // block depends on depth
      const blockData = Object.values(BLOCK_TYPES)[blockType]
      
      // For testing, throw in ores at shallow depths
      if (n === 15) {
        blockType = 5
      }
      if (n === 18) {
        blockType = 6
      }
      if (n === 21) {
        blockType = 7
      }
      if (n === 24) {
        blockType = 8
      }
      if (n === 27) {
        blockType = 9
      }

      blocks.push({
        x,
        y,
        isMined: false,
        mineable: true,
        blockType,
        value: blockData.value
      })
    }
  }

  return blocks
}

export function initializePlayer() {
  return {
    x: CANVAS_WIDTH / 2 - 25/2,
    y: SURFACE_Y - 60,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
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