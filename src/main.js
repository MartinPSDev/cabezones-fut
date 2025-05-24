import { Application, Assets, Sprite, Container } from "pixi.js";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application with larger size
  await app.init({ 
    background: "#1099bb", 
    width: 1024, 
    height: 768 
  });

  // Position the canvas at the left margin
  const canvas = app.canvas;
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  canvas.style.top = '0';

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(canvas);

  // Load all textures
  const backgroundTexture = await Assets.load("assets/estadio-vacio.png");
  const publicoTexture = await Assets.load("assets/publico.png");
  const lightsTexture = await Assets.load("assets/luces.png");
  const headTexture = await Assets.load("assets/head.png");
  const botinTexture = await Assets.load("assets/botin.png");

  // Create and add background
  const background = new Sprite(backgroundTexture);
  background.width = app.screen.width;
  background.height = app.screen.height;
  app.stage.addChild(background);

  // Create a container for the audience sections
  const audienceContainer = new Container();
  app.stage.addChild(audienceContainer);

  // Define the positions and transformations for each stand section
  const standPositions = [
    // Upper left section
    { x: -30, y: 230, width: 320, height: 140, skewX: -0.30, skewY: 0 },
    // Upper middle section
    { x: 330, y: 225, width: 350, height: 140, skewX: 0, skewY: 0 },
    // Upper right section
    { x: 730, y: 225, width: 320, height: 140, skewX: 0.30, skewY: 0 },
    // Lower left section
    { x: -60, y: 420, width: 320, height: 140, skewX: -0.15, skewY: 0 },
    // Lower middle section
    { x: 330, y: 410, width: 350, height: 140, skewX: 0, skewY: 0 },
    // Lower right section
    { x: 750, y: 415, width: 320, height: 140, skewX: 0.30, skewY: 0 }
  ];

  // Create and position audience sprites for each stand section
  standPositions.forEach(pos => {
    const audience = new Sprite(publicoTexture);
    audience.width = pos.width;
    audience.height = pos.height;
    audience.position.set(pos.x, pos.y);
    audience.skew.set(pos.skewX, pos.skewY);
    audienceContainer.addChild(audience);
  });

  // Add lights overlay on top
  const lights = new Sprite(lightsTexture);
  lights.width = app.screen.width;
  lights.height = app.screen.height;
  app.stage.addChild(lights);

  // --- Player Setup ---
  const player = new Container();
  player.x = app.screen.width / 2;
  player.y = app.screen.height / 2;
  app.stage.addChild(player);

  const head = new Sprite(headTexture);
  // Adjust anchor if needed, e.g., head.anchor.set(0.5);
  player.addChild(head);

  const botin = new Sprite(botinTexture);
  botin.anchor.set(0.5, 1); // Anchor at bottom-center (talon)

  // --- TEMPORARY DEBUGGING --- 
  // Set a fixed scale and position to check visibility
  botin.scale.set(0.5); // Make it 50% of its original size
  botin.x = 50;         // Position relative to player container's origin
  botin.y = 50;         // Position relative to player container's origin
  // --- END TEMPORARY DEBUGGING ---

  /* Original scaling and positioning logic (commented out for debugging)
  const desiredBotinScaleFactor = 0.3; 
  botin.scale.set(desiredBotinScaleFactor);
  botin.x = head.width / 2; 
  botin.y = head.height;    
  */

  player.addChild(botin);
  
  // Animation properties for kick
  const originalBotinRotation = botin.rotation; // Should be 0 if not rotated initially
  let isKicking = false;
  const kickRotationAmount = -Math.PI / 4; // Rotate by -45 degrees (PI/4 radians)
  const kickRotationSpeed = 0.1; // Speed of rotation

  // --- Keyboard Controls ---
  const keys = {};
  const playerSpeed = 5;

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space" && !isKicking) {
      isKicking = true;
      // Kick animation will be handled in the ticker
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  app.ticker.add((ticker) => {
    const delta = ticker.deltaTime; // Or use ticker.deltaMS for milliseconds

    // Player movement
    if (keys["ArrowUp"]) {
      player.y -= playerSpeed * delta;
    }
    if (keys["ArrowDown"]) {
      player.y += playerSpeed * delta;
    }
    if (keys["ArrowLeft"]) {
      player.x -= playerSpeed * delta;
    }
    if (keys["ArrowRight"]) {
      player.x += playerSpeed * delta;
    }

    // Kick animation
    if (isKicking) {
      // Move towards target kick rotation
      if (botin.rotation > originalBotinRotation + kickRotationAmount) {
        botin.rotation -= kickRotationSpeed * delta;
        // Clamp if overshot
        if (botin.rotation <= originalBotinRotation + kickRotationAmount) {
          botin.rotation = originalBotinRotation + kickRotationAmount;
          isKicking = false; // End of upward kick motion
        }
      } else { // Should not happen if logic is correct, but as a fallback
        isKicking = false;
      }
    } else if (botin.rotation < originalBotinRotation) {
      // Return botin to original rotation
      botin.rotation += kickRotationSpeed * delta;
      // Clamp if overshot
      if (botin.rotation >= originalBotinRotation) {
        botin.rotation = originalBotinRotation;
      }
    }
    
    // Keep player within bounds (optional)
    player.x = Math.max(0, Math.min(app.screen.width - player.width, player.x));
    player.y = Math.max(0, Math.min(app.screen.height - player.height, player.y));
  });

})();
