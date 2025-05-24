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
  const botinTexture = await Assets.load("assets/bota.png");

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
  botin.anchor.set(1, 1); // Anchor en el talón (esquina inferior derecha)
  
  // Escalar el botín al tamaño de la cabeza
  botin.width = head.width;
  botin.height = head.height;

  // Posicionar el botín pegado a la parte inferior de la cabeza
  botin.x = head.width; // El talón (anchor point) en el extremo derecho de la cabeza
  botin.y = head.height + 20; // Ajustado 20 píxeles más abajo

  player.addChild(botin);
  
  // Animation properties
  const originalBotinX = botin.x;
  const originalBotinY = botin.y;
  const originalBotinRotation = 0; // Rotación inicial normal
  let isKicking = false;
  let kickPhase = 0; // 0: no kicking, 1: rotación, 2: traslación

  // Parámetros de la animación
  const rotationDuration = 15; // Frames para la rotación
  const translationDuration = 20; // Frames para la traslación
  let currentFrame = 0;
  const startRotation = 0; // Comienza sin rotación
  const finalRotation = -Math.PI / 2; // Punta hacia ARRIBA (-90 grados)
  const parabolaHeight = head.height * 0.8; 
  const parabolaWidth = head.width * 1.0; 

  // --- Keyboard Controls ---
  const keys = {};
  const playerSpeed = 5;

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") {
      console.log("Spacebar pressed, keys['Space'] set to:", keys["Space"]);
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "Space") {
      console.log("Spacebar released, keys['Space'] set to:", keys["Space"]);
    }
  });

  app.ticker.add((ticker) => {
    const delta = ticker.deltaTime;

    // Player movement
    if (keys["ArrowUp"]) player.y -= playerSpeed * delta;
    if (keys["ArrowDown"]) player.y += playerSpeed * delta;
    if (keys["ArrowLeft"]) player.x -= playerSpeed * delta;
    if (keys["ArrowRight"]) player.x += playerSpeed * delta;

    // Iniciar animación con la barra espaciadora
    if (keys["Space"]) {
        if (!isKicking) { // Si no está pateando actualmente, iniciar una nueva patada
            isKicking = true;
            kickPhase = 1;       // Forzar inicio en la fase de rotación
            currentFrame = 0;    // Resetear el contador de frames
            botin.rotation = startRotation; // Asegurar rotación inicial para la animación
        }
    }

    // Kick animation
    if (isKicking) {
        currentFrame++;
        
        if (kickPhase === 1) { // Fase de rotación
            const rotationProgress = Math.min(currentFrame / rotationDuration, 1);
            botin.rotation = startRotation + (finalRotation - startRotation) * rotationProgress;
            
            if (currentFrame >= rotationDuration) {
                kickPhase = 2; // Pasar a la fase de traslación
                currentFrame = 0; // Resetear frame para la nueva fase
            }
        } 
        else if (kickPhase === 2) { // Fase de traslación
            const progress = Math.min(currentFrame / translationDuration, 1);
            
            // Calcular desplazamiento en X (movimiento hacia adelante)
            const dx = progress * parabolaWidth;
            
            // Calcular desplazamiento en Y para la parábola (hacia abajo y luego recupera)
            // dy_offset será positivo, representando el descenso desde originalBotinY.
            const dy_offset = 4 * parabolaHeight * progress * (1 - progress);
            
            // Aplicar posición relativa a la original
            botin.x = originalBotinX + dx;
            botin.y = originalBotinY + dy_offset; // Sumar dy_offset para mover hacia abajo
            
            if (currentFrame >= translationDuration) {
                // Resetear la animación
                isKicking = false;
                kickPhase = 0; // Esencial para permitir la próxima patada
                currentFrame = 0;
                botin.x = originalBotinX;
                botin.y = originalBotinY;
                botin.rotation = originalBotinRotation;
            }
        }
    }
    
    // Keep player within bounds
    player.x = Math.max(0, Math.min(app.screen.width - player.width, player.x));
    player.y = Math.max(0, Math.min(app.screen.height - player.height, player.y));
  });

})();
