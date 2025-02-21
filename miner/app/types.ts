export interface Player {
  x: number
  y: number
  velocityX: number
  velocityY: number
  onGround: boolean
  onClimbable: boolean  // New property for ladder mechanics
  facingRight: boolean
  isWalking: boolean
  inventory: number
  gold: number
  pickaxeLevel: number
  backpackLevel: number
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
  value: number
  solid: boolean    // New property for collision detection
  climbable: boolean // New property for ladder mechanics
  machineState?: MachineState // Optional machine state for blocks that are machines
  // New properties for multi-block structures
  isSecondaryBlock?: boolean
  mainBlockX?: number
  mainBlockY?: number
}

export interface MachineState {
  processingBlockType: number | null // The type of block being processed
  processingStartTime: number | null // When processing started
  isFinished: boolean // Whether processing is complete
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