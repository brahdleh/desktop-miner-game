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

// Helper function for normal distribution probability
function normalDistribution(depth: number, mean: number, std: number): number {
  const exp = -0.5 * Math.pow((depth - mean) / std, 2);
  return Math.exp(exp);
}

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
      value: 1,
      solid: true,
      climbable: false
    })
  }

  // Define ore distribution parameters
  const oreDistribution = {
    copper: { mean: 15, std: 15, maxProb: 0.09 },
    iron: { mean: 40, std: 15, maxProb: 0.08 },
    gold: { mean: 65, std: 15, maxProb: 0.07 },
    diamond: { mean: 90, std: 15, maxProb: 0.06 }
  };

  // Generate mine shaft
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      const depth = (y - SURFACE_Y) / BLOCK_SIZE
      var blockType = depth > 75 ? 4 : depth > 50 ? 3 : depth > 25 ? 2 : 1  // block depends on depth
      
      // Calculate ore probabilities using normal distribution
      const random = Math.random()
      
      // Copper (type 5)
      if (depth >= 6 && random < oreDistribution.copper.maxProb * normalDistribution(depth, oreDistribution.copper.mean, oreDistribution.copper.std)) {
        blockType = 5
      }
      // Iron (type 6)
      else if (depth >= 28 && random < oreDistribution.iron.maxProb * normalDistribution(depth, oreDistribution.iron.mean, oreDistribution.iron.std)) {
        blockType = 6
      }
      // Gold (type 7)
      else if (depth >= 53 && random < oreDistribution.gold.maxProb * normalDistribution(depth, oreDistribution.gold.mean, oreDistribution.gold.std)) {
        blockType = 7
      }
      // Diamond (type 8)
      else if (depth >= 78 && random < oreDistribution.diamond.maxProb * normalDistribution(depth, oreDistribution.diamond.mean, oreDistribution.diamond.std)) {
        blockType = 8  // Note: Changed from 7 to 8 as it appeared to be a bug in original code
      }

      const blockData = Object.values(BLOCK_TYPES)[blockType]

      blocks.push({
        x,
        y,
        isMined: false,
        mineable: true,
        blockType,
        value: blockData.value,
        solid: blockData.solid,
        climbable: blockData.climbable
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
