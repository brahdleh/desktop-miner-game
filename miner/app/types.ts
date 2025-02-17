export interface Player {
  x: number
  y: number
  velocityX: number
  velocityY: number
  onGround: boolean
  onClimbable: boolean  // New property for ladder mechanics
  inventory: number
  gold: number
  pickaxeLevel: number
  backpackLevel: number
  backpackCapacity: number
  blockInventory: number[]
  selectedSlot: number
  pickaxeType: number
  backpackType: number
}

export enum BlockType {
  GRASS = 0,
  DIRT = 1,
  SLATE = 2,
  MAGMA = 3,
  BEDROCK = 4,
  COPPER = 5,
  IRON = 6,
  GOLD = 7,
  DIAMOND = 8,
  PLATFORM = 9,
  LADDER = 10,
  TORCH = 11
}

export interface BlockDefinition {
  name: string;
  color: string;
  value: number;
  density: number;
  miningTimeMultiplier: number;
  solid: boolean;
  climbable: boolean;
  minDepth?: number;  // Minimum depth where this block can appear
  distribution?: {
    mean: number;
    std: number;
    maxProb: number;
  };
}

export interface Block {
  x: number
  y: number
  isMined: boolean
  mineable: boolean
  blockType: number
  value: number
  solid: boolean    // New property for collision detection
  climbable: boolean // New property for ladder mechanics
}

export interface Zone {
  x: number
  y: number
  width: number
  height: number
} 