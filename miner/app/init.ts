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
  PICKAXE_TYPES
} from './constants'
import { clamp } from './utils/data-utils'

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
  const normaldist =  oreDist.maxProb * Math.exp(exp);
  const plateauDist = oreDist.plateau * clamp((depth-oreDist.mean)/oreDist.std, 0, 1);
  return  normaldist + plateauDist;
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
    copper: { mean: 15, std: 30, maxProb: 0.09, plateau: 0.04 },
    iron: { mean: 40, std: 30, maxProb: 0.08, plateau: 0.04},
    gold: { mean: 65, std: 30, maxProb: 0.07, plateau: 0.04},
    diamond: { mean: 90, std: 30, maxProb: 0.06, plateau: 0.05 }
  };

  // Generate mine shaft
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      const depth = (y - SURFACE_Y) / BLOCK_SIZE
      let blockType = depth > 75 ? 4 : depth > 50 ? 3 : depth > 25 ? 2 : 1  // block depends on depth
            
      // Copper (type 5)
      if (depth >= 6 && Math.random() < oreDistributionFunction(depth, oreDistributions.copper)) {
        blockType = 5
      }
      // Iron (type 6)
      if (depth >= 28 && Math.random() < oreDistributionFunction(depth, oreDistributions.iron)) {
        blockType = 6
      }
      // Gold (type 7)
      if (depth >= 53 && Math.random() < oreDistributionFunction(depth, oreDistributions.gold)) {
        blockType = 7
      }
      // Diamond (type 8)
      if (depth >= 78 && Math.random() < oreDistributionFunction(depth, oreDistributions.diamond)) {
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
    gold: 10000,
    proficiency: 1,
    strength: 1,
    backpackCapacity: BACKPACK_TYPES.STONE.capacity,
    pickaxePower: PICKAXE_TYPES.STONE.miningTimeMultiplier,
    inventorySlots: Array(15).fill(null).map(() => ({ 
      blockType: null, 
      count: 0 
    })) as InventorySlot[],
    selectedSlot: 0,
    backpackType: 0,
    pickaxeType: 0
  }
} 
