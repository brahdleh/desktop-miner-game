import { Block } from './types'
import {
  CANVAS_WIDTH, BLOCK_SIZE, SURFACE_Y,
  MINE_LEFT, MINE_WIDTH, MINE_DEPTH_PX,
  BASE_BACKPACK_CAPACITY
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
      blockType: 0
    })
  }

  // Generate mine shaft
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      blocks.push({
        x,
        y,
        isMined: false,
        mineable: true,
        blockType: 1
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
    backpackCapacity: BASE_BACKPACK_CAPACITY,
    blockInventory: [0],
    selectedSlot: 0,
  }
} 