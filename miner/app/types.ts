export interface Player {
  x: number
  y: number
  velocityX: number
  velocityY: number
  onGround: boolean
  onClimbable: boolean  // New property for ladder mechanics
  currentLadderType: number | undefined
  facingRight: boolean
  isWalking: boolean
  inventory: number
  gold: number
  proficiency: number
  strength: number
  backpackCapacity: number
  pickaxePower: number
  inventorySlots: InventorySlot[]
  selectedSlot: number
  pickaxeType: number
  backpackType: number
}

export interface Block {
  x: number
  y: number
  isMined: boolean
  mineable: boolean
  blockType: number
  machineState?: MachineState // Optional machine state for blocks that are machines
  storageState?: StorageState // Optional storage state for blocks that are storage
  isSecondaryBlock?: boolean
  mainBlockX?: number
  mainBlockY?: number
}

export interface BlockData {
  id: number
  value: number
  color: string
  miningTimeMultiplier: number
  density: number
  name: string
  solid: boolean
  climbable: boolean
  requirements: {
    blockType: number
    amount: number
    base?: number  // Optional field for machine upgrades
  } | null
  size: [number, number],
  category: string
}

export interface MachineState {
  processingBlockType: number | null // The type of block being processed
  processingStartTime: number | null // When processing started
  isFinished: boolean // Whether processing is complete
}

export interface StorageState {
  storedBlocks: {
    blockType: number
    count: number
  }[]
}

export interface Zone {
  x: number
  y: number
  width: number
  height: number
}

export interface InventorySlot {
  blockType: number | null;  // null means empty slot
  count: number;
}