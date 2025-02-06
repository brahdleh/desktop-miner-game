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
}

export interface Block {
  x: number
  y: number
  isMined: boolean
  mineable: boolean
}

export interface Zone {
  x: number
  y: number
  width: number
  height: number
} 