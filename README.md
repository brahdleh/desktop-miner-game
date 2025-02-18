# Desktop Miner
A fun mining web-game for killing time and mining blocks

To do for optimisation:

Here are several quick fixes you can try to improve performance:

Cache Offscreen Canvases and Gradients

Lighting Canvas: Currently, you create a new canvas element every frame in drawDarknessOverlay. Instead, create an offscreen canvas once (outside the main render loop) and reuse it every frame.
Gradients: If your darkness gradient doesn’t change frequently, cache it instead of recreating it every frame.
Cull Offscreen Elements

Blocks and Objects: Before drawing each block (or other object), check if it’s within the viewport (i.e., visible on the canvas) using the cameraOffsetY. Skipping offscreen elements can save a lot of processing time.
Pre-render Static Backgrounds

Background Layers: If the sky or building textures are static, consider rendering them once to an offscreen canvas and then simply drawing that canvas each frame. This avoids redrawing complex static imagery repeatedly.
Minimize Global Composite Operations

The globalCompositeOperation used in the darkness overlay is costly. Try to limit how often you use it (or pre-render the lighting effects) if possible.
Batch Draw Calls and Simplify Draw Logic

Grouping Similar Calls: For example, if many blocks share the same texture, try grouping their drawing into fewer draw calls.
Text Rendering: If text (like the zone labels) is static or rarely changes, consider pre-rendering it to an image.
