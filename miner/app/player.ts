import { Player, Block, Zone } from './types'
import { 
  PLAYER_WIDTH, PLAYER_HEIGHT, MOVE_SPEED, JUMP_STRENGTH, 
  GRAVITY, CANVAS_WIDTH, BLOCK_SIZE, SURFACE_Y, MINE_LEFT, 
  MINE_WIDTH, TERMINAL_VELOCITY
} from './constants'
import { isClimbable, isSolid } from './utils/data-utils'
import { getLadderSpeed } from './utils/calculation-utils'

export function handleInput(player: Player, keys: { [key: string]: boolean }) {
  player.velocityX = 0
  player.isWalking = false
  if (keys["a"]) { 
    player.velocityX = -MOVE_SPEED
    player.facingRight = false
    player.isWalking = true
  }
  if (keys["d"]) {
    player.velocityX = MOVE_SPEED
    player.facingRight = true
    player.isWalking = true
  }

  // Check if player is on a climbable block (ladder)
  const isOnLadder = player.onClimbable
  
  if (isOnLadder) {
    // Climbing mechanics
    player.velocityY = 0
    // Use ladder speed coefficient to adjust climbing speed
    const ladderSpeedMultiplier = getLadderSpeed(player.currentLadderType || 0);
    if (keys["w"]) player.velocityY = -MOVE_SPEED * ladderSpeedMultiplier;
    if (keys["s"]) player.velocityY = MOVE_SPEED * ladderSpeedMultiplier;
  } else {
    // Normal jumping mechanics
    if ((keys[" "] || keys["w"]) && player.onGround) {
      player.velocityY = -JUMP_STRENGTH
      player.onGround = false
    }
  }
}

function collision(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (
    a.x < b.x + BLOCK_SIZE &&
    a.x + PLAYER_WIDTH > b.x &&
    a.y < b.y + BLOCK_SIZE &&
    a.y + PLAYER_HEIGHT > b.y
  )
}

export function updatePlayer(player: Player, blocks: Block[]) {
  player.x += player.velocityX
  player.y += player.velocityY
  
  // Only apply gravity when not on ladder
  if (!player.onClimbable) {
    player.velocityY += GRAVITY
    if (Math.abs(player.velocityY) > TERMINAL_VELOCITY) {
      player.velocityY = Math.sign(player.velocityY) * TERMINAL_VELOCITY
    }
  }

  // Reset climbing state
  player.onClimbable = false
  player.currentLadderType = undefined
  //player.onGround = false

  // Collision detection with blocks
  for (const block of blocks) {
    if (!block.isMined && collision(player, block)) {
      // Check if block is climbable
      if (isClimbable(block.blockType)) {
        player.onClimbable = true
        player.currentLadderType = block.blockType
        continue // Skip collision resolution for climbable blocks
      }

      // Skip collision for non-solid blocks
      if (!isSolid(block.blockType)) {
        continue
      }

      // Vertical collision
      if (player.velocityY > 0 && player.y + PLAYER_HEIGHT <= block.y + player.velocityY) {
        player.y = block.y - PLAYER_HEIGHT
        player.velocityY = 0
        player.onGround = true
      } else if (player.velocityY < 0 && player.y >= block.y + BLOCK_SIZE + player.velocityY) {
        player.y = block.y + BLOCK_SIZE
        player.velocityY = 0
      }
      // Horizontal collisions
      if (player.velocityX > 0 && player.x + PLAYER_WIDTH <= block.x + player.velocityX) {
        player.x = block.x - PLAYER_WIDTH
      } else if (player.velocityX < 0 && player.x >= block.x + BLOCK_SIZE + player.velocityX) {
        player.x = block.x + BLOCK_SIZE
      }
    }
  }

  // Handle boundaries
  if (player.y > SURFACE_Y) {
    // Below surface -> clamp to shaft
    const leftLimit = MINE_LEFT
    const rightLimit = MINE_LEFT + MINE_WIDTH * BLOCK_SIZE - PLAYER_WIDTH
    if (player.x < leftLimit) player.x = leftLimit
    if (player.x > rightLimit) player.x = rightLimit
  } else {
    // Above surface -> clamp to canvas
    player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - PLAYER_WIDTH))
  }
}

export function isPlayerInZone(player: Player, zone: Zone) {
  const pxCenter = player.x + PLAYER_WIDTH / 2
  return (
    pxCenter >= zone.x &&
    pxCenter <= zone.x + zone.width
  )
} 