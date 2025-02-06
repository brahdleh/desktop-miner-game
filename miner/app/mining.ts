import { Player, Block } from './types'
import { 
  DEFAULT_MINE_TIME, 
  BLOCK_SIZE,
  PICKAXE_BASE_COST, 
  PICKAXE_COST_MULTIPLIER,
  BACKPACK_BASE_COST, 
  BACKPACK_COST_MULTIPLIER,
  BASE_BACKPACK_CAPACITY, 
  BACKPACK_CAPACITY_INCREMENT
} from './constants'

export function handleMining(
  player: Player, 
  miningTargetBlock: Block | null,
  miningProgress: number,
  updateHUD: () => void
): { miningProgress: number; miningTargetBlock: Block | null } {
  if (!miningTargetBlock) {
    return { miningProgress, miningTargetBlock }
  }

  miningProgress += 16.67 // approximate per frame at ~60fps
  const requiredTime = Math.max(DEFAULT_MINE_TIME / player.pickaxeLevel)
  
  if (miningProgress >= requiredTime) {
    miningTargetBlock.isMined = true
    if (player.inventory < player.backpackCapacity) {
      player.inventory++
    }
    updateHUD()
    return { miningProgress: 0, miningTargetBlock: null }
  }

  return { miningProgress, miningTargetBlock }
}

export function attemptSell(player: Player, updateHUD: () => void) {
  if (player.inventory > 0) {
    player.gold += player.inventory
    player.inventory = 0
    updateHUD()
  }
}

export function attemptPickaxeUpgrade(player: Player, updateHUD: () => void) {
  const cost = PICKAXE_BASE_COST * Math.pow(PICKAXE_COST_MULTIPLIER, player.pickaxeLevel - 1)
  if (player.gold >= cost) {
    player.gold -= cost
    player.pickaxeLevel += 1
    updateHUD()
  }
}

export function attemptBackpackUpgrade(player: Player, updateHUD: () => void) {
  const cost = BACKPACK_BASE_COST * Math.pow(BACKPACK_COST_MULTIPLIER, player.backpackLevel - 1)
  if (player.gold >= cost) {
    player.gold -= cost
    player.backpackLevel += 1
    player.backpackCapacity = BASE_BACKPACK_CAPACITY + (player.backpackLevel - 1) * BACKPACK_CAPACITY_INCREMENT
    updateHUD()
  }
}

export function canMineBlock(
  block: Block,
  clickX: number,
  clickY: number,
  player: Player
): boolean {
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