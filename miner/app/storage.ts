import { Player, Block } from './types'
import { getGridPosition } from './utils/data-utils'
import { BLOCK_SIZE, CANVAS_WIDTH, SURFACE_Y, MINE_LEFT, MINE_WIDTH, MINE_DEPTH_PX } from './constants'

export function saveGame(player: Player, blocks: Block[]) {
  try {
    localStorage.setItem('miner_player', JSON.stringify(player))
    localStorage.setItem('miner_blocks', JSON.stringify(blocks))
    console.log('Game saved successfully')
  } catch (error) {
    console.error('Failed to save game:', error)
  }
}

export function loadGame(): { player: Player | null, blocks: Block[] | null } {
  try {
    const playerData = localStorage.getItem('miner_player')
    const blocksData = localStorage.getItem('miner_blocks')
    
    if (!playerData || !blocksData) {
      console.log('No saved game found')
      return { player: null, blocks: null }
    }

    const player = JSON.parse(playerData)
    const blocks = JSON.parse(blocksData)
    console.log('Game loaded successfully')
    return { player, blocks }
  } catch (error) {
    console.error('Failed to load game:', error)
    return { player: null, blocks: null }
  }
}

export function blocksToHexArray(blocks: Block[]): string {
  // Pad each block type to 2 digits before joining
  const blockTypesStr = blocks.map(block => 
    block.blockType.toString().padStart(2, '0')
  ).join('')
  return BigInt(blockTypesStr).toString(16)
}

export function hexArrayToBlocks(hexString: string): Block[] {
  const blocks: Block[] = []
  const blockTypesStr = BigInt(`0x${hexString}`).toString()
  
  // First generate surface blocks
  for (let x = 0; x < CANVAS_WIDTH; x += BLOCK_SIZE) {
    const index = blocks.length * 2
    blocks.push({
      x,
      y: SURFACE_Y,
      blockType: parseInt(blockTypesStr.slice(index, index + 2)) || 0,
      isMined: false,
      mineable: x >= MINE_LEFT && x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE,
      isSecondaryBlock: false
    })
  }

  // Then generate mine shaft blocks
  for (let y = SURFACE_Y + BLOCK_SIZE; y < SURFACE_Y + MINE_DEPTH_PX; y += BLOCK_SIZE) {
    for (let x = MINE_LEFT; x < MINE_LEFT + MINE_WIDTH * BLOCK_SIZE; x += BLOCK_SIZE) {
      const index = blocks.length * 2
      blocks.push({
        x,
        y,
        blockType: parseInt(blockTypesStr.slice(index, index + 2)) || 0,
        isMined: false,
        mineable: true,
        isSecondaryBlock: false
      })
    }
  }

  return blocks
}