export interface Player {
  x: number
  y: number
  velocityX: number
  velocityY: number
  onGround: boolean
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
}

export interface Zone {
  x: number
  y: number
  width: number
  height: number
} 