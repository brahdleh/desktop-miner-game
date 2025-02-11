// Create an object to store all block textures
const blockTextures: { [key: string]: HTMLImageElement } = {}

// Function to load a texture and store it in blockTextures
function loadTexture(name: string): Promise<void> {
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

// Load all block textures
export async function loadBlockTextures(): Promise<void> {
  try {
    await Promise.all([
      loadTexture('grass'),
      loadTexture('stone'),
      loadTexture('slate'),
      loadTexture('magma'),
      loadTexture('bedrock'),
      loadTexture('copper'),
      loadTexture('iron'),
      loadTexture('gold'),
      loadTexture('diamond'),
    ])
    console.log('Block textures loaded successfully')
  } catch (error) {
    console.error('Failed to load block textures:', error)
  }
}

// Function to get a texture
export function getBlockTexture(name: string): HTMLImageElement | null {
  return blockTextures[name.toLowerCase()] || null
} 