import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, 
  BLOCK_SIZE,
  MAX_BACKPACK_LEVEL,
  MAX_PICKAXE_LEVEL,
  REFINABLE_BLOCKS,
  REFINING_TIME
} from './constants'
import { 
  updatePickaxePower, getPickaxeUpgradeCost, getBackpackUpgradeCost, updateBackpackCapacity
} from './utils/calculation-utils'
import { 
  getBlockData, getPickaxeData, getBackpackData, 
  canHoldBlock, getBlockInventory, buyBlock 
} from './utils/data-utils'


export function handleMining(
  player: Player, 
  miningTargetBlock: Block | null,
  miningProgress: number
): { miningProgress: number; miningTargetBlock: Block | null; requiredTime?: number } {
  if (!miningTargetBlock) {
    return { miningProgress, miningTargetBlock }
  }
  const blockData = getBlockData(miningTargetBlock.blockType)

  // Stop mining if inventory becomes full
  if (!canHoldBlock(player, miningTargetBlock.blockType)) {
    return { miningProgress: 0, miningTargetBlock: null }
  }

  miningProgress += 16.67 // approximate per frame at ~60fps
  
  // Calculate required time based on block type
  const baseTime = DEFAULT_MINE_TIME / player.pickaxePower
  const requiredTime = baseTime * blockData.miningTimeMultiplier
  
  if (miningProgress >= requiredTime) {
    miningTargetBlock.isMined = true
    // Check if inventory is full based on block density
    if (canHoldBlock(player, miningTargetBlock.blockType)) {
      player.inventory += blockData.density
      player.blockInventory[miningTargetBlock.blockType] ++
    }

    return { miningProgress: 0, miningTargetBlock: null }
  }

  return { miningProgress, miningTargetBlock, requiredTime }
}

export function attemptSell(player: Player) {
  const selectedBlockCount = getBlockInventory(player)
  if (selectedBlockCount > 0) {
    const blockData = getBlockData(player.selectedSlot)
    player.gold += blockData.value * selectedBlockCount
    player.blockInventory[player.selectedSlot] = 0
    player.inventory -= blockData.density * selectedBlockCount
  }
}

export function attemptBuy(player: Player, blockType: number) {
  const itemData = getBlockData(blockType)
  if (player.gold >= itemData.value && player.inventory < player.backpackCapacity) {
    buyBlock(player, blockType)
  }
}

export function attemptPickaxeUpgrade(player: Player) {
  // Check if already at max level
  if (player.pickaxeLevel >= MAX_PICKAXE_LEVEL) return

  const cost = getPickaxeUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.pickaxeLevel += 1
    updatePickaxePower(player)
  }
}

export function attemptBackpackUpgrade(player: Player) {
  // Check if already at max level
  if (player.backpackLevel >= MAX_BACKPACK_LEVEL) return

  const cost = getBackpackUpgradeCost(player)
  
  if (player.gold >= cost) {
    player.gold -= cost
    player.backpackLevel += 1
    updateBackpackCapacity(player)
  }
}

export function canMineBlock(
  block: Block,
  clickX: number,
  clickY: number,
  player: Player
): boolean {
  // Check if inventory is full
  if (player.inventory >= player.backpackCapacity) return false
  
  if (block.isMined || !block.mineable) return false

  const isClickInBlock = 
    clickX >= block.x &&
    clickX < block.x + BLOCK_SIZE &&
    clickY >= block.y &&
    clickY < block.y + BLOCK_SIZE

  if (!isClickInBlock) return false

  // Distance check from player
  const distX = Math.abs((player.x + BLOCK_SIZE / 2) - (block.x + BLOCK_SIZE / 2))
  const distY = Math.abs((player.y + BLOCK_SIZE / 2) - (block.y + BLOCK_SIZE / 2))
  
  return distX <= BLOCK_SIZE * 2 && distY <= BLOCK_SIZE * 2
}

export function attemptPlaceBlock(
  player: Player,
  blocks: Block[],
  clickX: number,
  clickY: number
): boolean {
  // Check if player has blocks to place
  if (player.blockInventory[player.selectedSlot] <= 0) return false

  // Calculate grid position
  const gridX = Math.floor(clickX / BLOCK_SIZE) * BLOCK_SIZE
  const gridY = Math.floor(clickY / BLOCK_SIZE) * BLOCK_SIZE

  // Check if position is valid (was previously mined)
  const existingBlock = blocks.find(b => 
    b.x === gridX && 
    b.y === gridY && 
    b.isMined && 
    b.mineable
  )

  if (!existingBlock) return false

  // Check if player is too far
  const distX = Math.abs((player.x + BLOCK_SIZE/2) - (gridX + BLOCK_SIZE/2))
  const distY = Math.abs((player.y + BLOCK_SIZE/2) - (gridY + BLOCK_SIZE/2))
  if (distX > BLOCK_SIZE * 2 || distY > BLOCK_SIZE * 2) return false

  // Place the block with the correct block type
  existingBlock.isMined = false
  existingBlock.blockType = player.selectedSlot  // Set block type to match inventory slot
  const blockData = getBlockData(player.selectedSlot)
  player.blockInventory[player.selectedSlot]--
  player.inventory -= blockData.density
  return true
}

export function attemptCraftRefiner(player: Player) {
  const itemData = getBlockData(14) // Refiner block type
  if (itemData.requirements) {
    const { blockType, amount } = itemData.requirements
    if (player.blockInventory[blockType] < amount) return false
    
    // Consume materials
    player.blockInventory[blockType] -= amount
    player.inventory -= amount * getBlockData(blockType).density    
    // add item
    player.blockInventory[14] ++    
    return true
  }
  return false
}

export function attemptCraftPickaxe(player: Player) {
  // Get next pickaxe type
  const nextPickaxeType = player.pickaxeType + 1
  const nextPickaxe = getPickaxeData(nextPickaxeType)
  
  // Check if next pickaxe exists
  if (!nextPickaxe) return false
  
  // Check requirements
  if (nextPickaxe.requirements) {
    const { blockType, amount } = nextPickaxe.requirements
    if (player.blockInventory[blockType] < amount) return false
    
    // Consume materials
    player.blockInventory[blockType] -= amount
    player.inventory -= amount * getBlockData(blockType).density  
    
    // Upgrade pickaxe
    player.pickaxeType = nextPickaxeType
    player.pickaxeLevel = 1  // Reset level when upgrading type
    updatePickaxePower(player)
    
    return true
  }
  
  return false
}

export function attemptCraftBackpack(player: Player) {
  // Get next backpack type
  const nextBackpackType = player.backpackType + 1
  const nextBackpack = getBackpackData(nextBackpackType)
  
  // Check if next backpack exists
  if (!nextBackpack) return false
  
  // Check requirements
  if (nextBackpack.requirements) {
    const { blockType, amount } = nextBackpack.requirements
    if (player.blockInventory[blockType] < amount) return false
    
    // Consume materials
    player.blockInventory[blockType] -= amount
    player.inventory -= amount * getBlockData(blockType).density   
    
    // Upgrade backpack
    player.backpackType = nextBackpackType
    player.backpackLevel = 1  // Reset level when upgrading type

    // Update backpack capacity
    updateBackpackCapacity(player)
    
    return true
  }

  return false
}

export function findNearbyRefiner(player: Player, blocks: Block[]): Block | null {
  const playerCenterX = player.x + BLOCK_SIZE / 2
  const playerBottom = player.y + BLOCK_SIZE

  for (const block of blocks) {
    if (block.blockType === 14 && !block.isMined) { // 14 is refiner
      const distX = Math.abs((block.x + BLOCK_SIZE / 2) - playerCenterX)
      const distY = Math.abs((block.y) - playerBottom)
      
      if (distX <= BLOCK_SIZE && distY <= BLOCK_SIZE) {
        return block
      }
    }
  }
  return null
}

export function attemptDepositInRefiner(player: Player, blocks: Block[]) {
  const refiner = findNearbyRefiner(player, blocks)
  if (!refiner) return false

  const selectedBlock = player.blockInventory[player.selectedSlot]
  if (selectedBlock <= 0) return false

  // Check if the selected block is refinable
  if (!REFINABLE_BLOCKS[player.selectedSlot as keyof typeof REFINABLE_BLOCKS]) return false

  // Initialize machine state if needed
  if (!refiner.machineState) {
    refiner.machineState = {
      processingBlockType: null,
      processingStartTime: null,
      isFinished: false
    }
  }

  // Check if refiner is already processing
  if (refiner.machineState.processingBlockType !== null) return false

  // Start processing
  refiner.machineState.processingBlockType = player.selectedSlot
  refiner.machineState.processingStartTime = Date.now()
  refiner.machineState.isFinished = false

  // Remove block from inventory
  player.blockInventory[player.selectedSlot]--
  player.inventory--

  return true
}

export function attemptCollectFromRefiner(player: Player, blocks: Block[]) {
  const refiner = findNearbyRefiner(player, blocks)
  if (!refiner || !refiner.machineState?.processingBlockType) return false

  // Check what block is output and that it exists
  const inputBlockType = refiner.machineState.processingBlockType
  const outputBlockType = REFINABLE_BLOCKS[inputBlockType as keyof typeof REFINABLE_BLOCKS]
  if (!outputBlockType) return false

  // Check if inventory has space assuming density does not change
  const blockData = getBlockData(outputBlockType)
  if (player.inventory + blockData.density > player.backpackCapacity) return false

  // If refining is incomplete return original block
  const elapsedTime = Date.now() - (refiner.machineState.processingStartTime || 0)
  if (elapsedTime < REFINING_TIME) {
    player.blockInventory[inputBlockType]++
    player.inventory += blockData.density
  } else {
    // Add refined block to inventory
    player.blockInventory[outputBlockType]++
    player.inventory += blockData.density
  }

  // Reset machine state
  refiner.machineState.processingBlockType = null
  refiner.machineState.processingStartTime = null
  refiner.machineState.isFinished = false

  return true
}
