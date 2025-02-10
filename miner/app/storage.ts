import { Player, Block } from './types'

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