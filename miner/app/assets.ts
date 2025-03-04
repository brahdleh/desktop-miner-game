// Create objects to store textures
const blockTextures: { [key: string]: HTMLImageElement } = {}
const sceneTextures: { [key: string]: HTMLImageElement } = {}
const iconTextures: { [key: string]: HTMLImageElement } = {}
const pickTextures: { [key: string]: HTMLImageElement } = {}
const playerTextures: { [key: string]: HTMLImageElement } = {}

// Function to load a texture and store it in blockTextures
function loadBlockTexture(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      blockTextures[name] = img
      resolve()
    }
    img.onerror = reject
    img.src = `/blocks/${name}.png`
  })
}

function loadSceneTexture(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      sceneTextures[name] = img
      resolve()
    }
    img.onerror = reject
    img.src = `/scene/${name}.png`
  })
}

function loadIconTexture(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      iconTextures[name] = img
      resolve()
    }
    img.onerror = reject
    img.src = `/icons/${name}.png`
  })
}

function loadPickTexture(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      pickTextures[name] = img
      resolve()
    }
    img.onerror = reject
    img.src = `/picks/${name}.png`
  })
}

function loadPlayerTexture(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      playerTextures[name] = img 
      resolve()
    }
    img.onerror = reject
    img.src = `/player/${name}.png`
  })
}

// Load all block textures
export async function loadBlockTextures(): Promise<void> {
  try {
    await Promise.all([
      loadBlockTexture('grass'),
      loadBlockTexture('stone'),
      loadBlockTexture('polished_stone'),
      loadBlockTexture('slate'),
      loadBlockTexture('polished_slate'),
      loadBlockTexture('magma'),
      loadBlockTexture('polished_magma'),
      loadBlockTexture('bedrock'),
      loadBlockTexture('polished_bedrock'),
      loadBlockTexture('copper'),
      loadBlockTexture('iron'),
      loadBlockTexture('gold'),
      loadBlockTexture('diamond'),
      loadBlockTexture('platform'),
      loadBlockTexture('torch'),
      loadBlockTexture('torch2'),
      loadBlockTexture('ladder'),
      loadBlockTexture('stone_ladder'),
      loadBlockTexture('slate_ladder'),
      loadBlockTexture('magma_ladder'),
      loadBlockTexture('bedrock_ladder'),
      loadBlockTexture('refiner'),
      loadBlockTexture('copper_refiner'),
      loadBlockTexture('iron_refiner'),
      loadBlockTexture('gold_refiner'),
      loadBlockTexture('diamond_refiner'),
      loadBlockTexture('refiner_core'),
      loadBlockTexture('refiner_core2'),
      loadBlockTexture('refiner_core3'),
      loadBlockTexture('refiner_core4'),
      loadBlockTexture('collector'),
      loadBlockTexture('chest'),
      loadBlockTexture('tube'),
      loadBlockTexture('tube2'),
      loadBlockTexture('tube3'),
      loadBlockTexture('tube4'),
    ])
    console.log('Block textures loaded successfully')
  } catch (error) {
    console.error('Failed to load block textures:', error)
  }
}

// Load all scene textures
export async function loadSceneTextures(): Promise<void> {
  try {
    await Promise.all([
      loadSceneTexture('sky'),
      loadSceneTexture('dirt'),
      loadSceneTexture('mine'),
      loadSceneTexture('underground'),
      loadSceneTexture('shop'),
      loadSceneTexture('smith'),
      loadSceneTexture('sell')
    ])
    console.log('Scene textures loaded successfully')
  } catch (error) {
    console.error('Failed to load scene textures:', error)
  }
}

// Add function to load UI icons
export async function loadIconTextures(): Promise<void> {
  try {
    await Promise.all([
      loadIconTexture('coin'),
      loadIconTexture('backpack'),
      loadIconTexture('inventory_selected'),
      loadIconTexture('inventory')
    ])
    console.log('Icon textures loaded successfully')
  } catch (error) {
    console.error('Failed to load icon textures:', error)
  }
}

// Add function to load pickaxe textures
export async function loadPickTextures(): Promise<void> {
  try {
    await Promise.all([
      loadPickTexture('stone'),
      loadPickTexture('copper'),
      loadPickTexture('iron'),
      loadPickTexture('gold'),
      loadPickTexture('diamond')
    ])
    console.log('Pick textures loaded successfully')
  } catch (error) {
    console.error('Failed to load pick textures:', error)
  }
}

// Add function to load player textures
export async function loadPlayerTextures(): Promise<void> {
  try {
    await Promise.all([
      loadPlayerTexture('standing'),
      loadPlayerTexture('step1'),
      loadPlayerTexture('step2'),
      loadPlayerTexture('jump'),
    ])
    console.log('Player textures loaded successfully')
  } catch (error) {
    console.error('Failed to load player textures:', error)
  }
}

// Update loadAllTextures
export async function loadAllTextures(): Promise<void> {
  await Promise.all([
    loadBlockTextures(),
    loadSceneTextures(),
    loadIconTextures(),
    loadPickTextures(),
    loadPlayerTextures()
  ])
}

// Function to get a texture
export function getBlockTexture(name: string): HTMLImageElement | null {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '_')
  return blockTextures[normalizedName] || null
} 

export function getSceneTexture(name: string): HTMLImageElement | null {
  return sceneTextures[name.toLowerCase()] || null
} 

export function getIconTexture(name: string): HTMLImageElement | null {
  return iconTextures[name.toLowerCase()] || null
}

export function getPickTexture(name: string): HTMLImageElement | null {
  return pickTextures[name.toLowerCase()] || null
} 

export function getPlayerTexture(name: string): HTMLImageElement | null {
  return playerTextures[name.toLowerCase()] || null
} 
