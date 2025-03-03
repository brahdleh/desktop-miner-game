import { Block, InventorySlot } from './types'
import {
  CANVAS_WIDTH, 
  BLOCK_SIZE, 
  SURFACE_Y,
  MINE_LEFT, 
  MINE_WIDTH, 
  MINE_DEPTH_PX,
  BACKPACK_TYPES,
  PICKAXE_TYPES
} from './constants'
import { clamp } from './utils/data-utils'

export interface oreDist {
  start: number,
  plateau: number,
  maxProb: number
}

// Helper function for distribution probability
function oreDistributionFunction(depth: number, oreDist: oreDist): number {
  // linear distribution then plateau kicks in
  return  oreDist.maxProb * clamp((depth-oreDist.start)/oreDist.plateau, 0, 1);
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

  // Define block distribution parameters
  const blockStarts = {
    stone: 0,
    slate: 25,
    magma: 60,
    bedrock: 100
  }

  // Define ore distribution parameters
  const oreDistributions = {
    copper: { start: blockStarts.stone + 5, plateau: blockStarts.stone + 10, maxProb: 0.07},
    iron: { start: blockStarts.slate + 5, plateau: blockStarts.slate + 10, maxProb: 0.07},
    gold: { start: blockStarts.magma + 5, plateau: blockStarts.magma + 10, maxProb: 0.07},
    diamond: { start: blockStarts.bedrock + 5, plateau: blockStarts.bedrock + 10, maxProb: 0.07 }
  };

  // Generate mine shaft
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      const depth = (y - SURFACE_Y) / BLOCK_SIZE
      let blockType = depth > blockStarts.bedrock ? 4 : depth > blockStarts.magma ? 3 : depth > blockStarts.slate ? 2 : 1  // block depends on depth
      
      // non discrete changeover
      if (depth >= blockStarts.slate && depth <= blockStarts.slate + 2 && Math.random() < 0.5) {
        blockType = 1
      }
      if (depth >= blockStarts.magma && depth <= blockStarts.magma + 2 && Math.random() < 0.5) {
        blockType = 2
      }
      if (depth >= blockStarts.bedrock && depth <= blockStarts.bedrock + 2 && Math.random() < 0.5) {
        blockType = 3
      }

      // Copper (type 5)
      if (Math.random() < oreDistributionFunction(depth, oreDistributions.copper)) {
        blockType = 5
      }
      // Iron (type 6)
      if (Math.random() < oreDistributionFunction(depth, oreDistributions.iron)) {
        blockType = 6
      }
      // Gold (type 7)
      if (Math.random() < oreDistributionFunction(depth, oreDistributions.gold)) {
        blockType = 7
      }
      // Diamond (type 8)
      if (Math.random() < oreDistributionFunction(depth, oreDistributions.diamond)) {
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
    currentLadderType: undefined,
    facingRight: true,
    isWalking: false,
    inventory: 0,
    gold: 0,
    proficiency: 1,
    strength: 1,
    backpackCapacity: 1000 * BACKPACK_TYPES.STONE.capacity,
    pickaxePower: 1000 * PICKAXE_TYPES.STONE.miningTimeMultiplier,
    inventorySlots: Array(15).fill(null).map(() => ({ 
      blockType: null, 
      count: 0 
    })) as InventorySlot[],
    selectedSlot: 0,
    backpackType: 0,
    pickaxeType: 0
  }
} 
