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