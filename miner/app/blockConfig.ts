import { BlockType, BlockDefinition } from './types'

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  [BlockType.GRASS]: {
    name: 'grass',
    color: '#3f7f3f',
    value: 1,
    density: 1,
    miningTimeMultiplier: 1,
    solid: true,
    climbable: false
  },
  [BlockType.DIRT]: {
    name: 'dirt',
    color: '#7f3f00',
    value: 2,
    density: 1,
    miningTimeMultiplier: 1,
    solid: true,
    climbable: false
  },
  [BlockType.COPPER]: {
    name: 'copper',
    color: '#b87333',
    value: 10,
    density: 2,
    miningTimeMultiplier: 1.5,
    solid: true,
    climbable: false,
    minDepth: 6,
    distribution: {
      mean: 15,
      std: 15,
      maxProb: 0.09
    }
  },
  // ... define other blocks similarly
}

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_DEFINITIONS[type]
} 