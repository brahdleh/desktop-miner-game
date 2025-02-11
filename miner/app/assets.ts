// Create objects to store textures
const blockTextures: { [key: string]: HTMLImageElement } = {}
const sceneTextures: { [key: string]: HTMLImageElement } = {}

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

// Load all block textures
export async function loadBlockTextures(): Promise<void> {
  try {
    await Promise.all([
      loadBlockTexture('grass'),
      loadBlockTexture('stone'),
      loadBlockTexture('slate'),
      loadBlockTexture('magma'),
      loadBlockTexture('bedrock'),
      loadBlockTexture('copper'),
      loadBlockTexture('iron'),
      loadBlockTexture('gold'),
      loadBlockTexture('diamond'),
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
    ])
    console.log('Scene textures loaded successfully')
  } catch (error) {
    console.error('Failed to load scene textures:', error)
  }
}

// Load all textures
export async function loadAllTextures(): Promise<void> {
  await loadBlockTextures()
  await loadSceneTextures()
}

// Function to get a texture
export function getBlockTexture(name: string): HTMLImageElement | null {
  return blockTextures[name.toLowerCase()] || null
} 

export function getSceneTexture(name: string): HTMLImageElement | null {
  return sceneTextures[name.toLowerCase()] || null
} 