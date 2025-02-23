import { Block, InventorySlot } from './types'
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

export interface oreDist {
  mean: number,
  std: number,
  maxProb: number,
  plateau: number
}

// Helper function for distribution probability
function oreDistributionFunction(depth: number, oreDist: oreDist): number {
  // Normal distribution until mean+std then plateau kicks in
  const exp = -0.5 * Math.pow((depth - oreDist.mean) / oreDist.std, 2);
  return oreDist.maxProb * Math.exp(exp) + oreDist.plateau * Math.min(Math.max(((depth-oreDist.mean)/oreDist.std),0),1);
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
    })
  }

  // Define ore distribution parameters
  const oreDistributions = {
    copper: { mean: 15, std: 30, maxProb: 0.09, plateau: 0.09 },
    iron: { mean: 40, std: 30, maxProb: 0.08, plateau: 0.08},
    gold: { mean: 65, std: 30, maxProb: 0.07, plateau: 0.07},
    diamond: { mean: 90, std: 30, maxProb: 0.06, plateau: 0.06 }
  };

  // Generate mine shaft
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      const depth = (y - SURFACE_Y) / BLOCK_SIZE
      let blockType = depth > 75 ? 4 : depth > 50 ? 3 : depth > 25 ? 2 : 1  // block depends on depth
      
      // Calculate ore probabilities using normal distribution
      const random = Math.random()
      
      // Copper (type 5)
      if (depth >= 6 && random < oreDistributionFunction(depth, oreDistributions.copper)) {
        blockType = 5
      }
      // Iron (type 6)
      else if (depth >= 28 && random < oreDistributionFunction(depth, oreDistributions.iron)) {
        blockType = 6
      }
      // Gold (type 7)
      else if (depth >= 53 && random < oreDistributionFunction(depth, oreDistributions.gold)) {
        blockType = 7
      }
      // Diamond (type 8)
      else if (depth >= 78 && random < oreDistributionFunction(depth, oreDistributions.diamond)) {
        blockType = 8 
      }

      blocks.push({
        x,
        y,
        isMined: false,
        mineable: true,
        blockType,
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
    facingRight: true,
    isWalking: false,
    inventory: 0,
    gold: 0,
    pickaxeLevel: 1,
    backpackLevel: 1,
    backpackCapacity: BACKPACK_TYPES.STONE.capacity,
    pickaxePower: 1,
    inventorySlots: Array(15).fill(null).map(() => ({ 
      blockType: null, 
      count: 0 
    })) as InventorySlot[],
    selectedSlot: 0,
    backpackType: 0,
    pickaxeType: 0
  }
} 
