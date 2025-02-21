Information on the sprites used in the game. All sprites will be displayed at 5x scale to give pixel art aestethic.

## /blocks

Blocks are able to be mined and placed by the player. Sprites given are:
- grass
- stone
- slate
- magma
- bedrock
- copper
- iron
- gold
- diamond
- platform
- torch
- ladder

## /icons

Icons are used in the UI. The coin symbol shows the player's currency, the backpack icon shows inventory, and there are two inventory sprites, one for selected one for unselected.

- coin
- backpack
- inventory_selected
- inventory_unselected

## /picks

These are used to show the player's pickaxe.

- stone
- copper
- iron
- gold
- diamond

## /scene

This folder contains the background sprites. The sky spans the entire width of the canvas at an in game size of 800x400. When grass is mined dirt is shown which is 4 blocks wide at in game 160x40. In the mine shaft after a block is removed we draw 'mine' which is 4x4 blocks or 160x160 at in game size. Outside of the shaft we draw 'underground' which is also 4x4 blocks or 160x160 at in game size.

On the surface we place a shop and smith at the top left and right of the screen. These are 4x4 blocks at in game size. Just to the right of the block is the sell stall where blocks are sold, this is only 1 block in size.

- sky
- dirt
- mine
- underground
- shop
- smith
- sell
