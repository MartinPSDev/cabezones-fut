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
  player.x = app.screen.width / 2 + 250;
  player.y = app.screen.height / 2 + 203;
  // Agregar escala al contenedor para hacer todo más grande
  player.scale.set(1.4); // Aumenta el tamaño del jugador 
  app.stage.addChild(player);

  const head = new Sprite(headTexture);
  const botin = new Sprite(botinTexture);
  botin.anchor.set(1, 1); // Anchor en el talón (esquina inferior derecha)
  
  // Escalar el botín a un tamaño más pequeño (70% del tamaño de la cabeza)
  botin.width = head.width * 0.6;
  botin.height = head.height * 0.6;

  // Ajustar la posición para mantener la alineación con la cabeza
  botin.x = head.width - 12;
  botin.y = head.height + 19; 

  // Agregar primero la bota (atrás) y luego la cabeza (adelante)
  player.addChild(botin);
  player.addChild(head);
  
  // Animation properties
  // Modificar las propiedades de animación
  const originalBotinX = botin.x;
  const originalBotinY = botin.y;
  const originalBotinRotation = 0;
  let isKicking = false;
  let currentFrame = 0;

  // Nuevos parámetros de animación
  const preparationFrames = 4;
  const kickFrames = 20;
  const restorationFrames = 10;
  const totalFrames = preparationFrames + kickFrames + restorationFrames;

  // Ángulo inicial y rotación total (ajustados para movimiento hacia adelante)
  const startAngle = Math.PI / 2; // Comenzamos desde 90 grados
  const totalRotation = Math.PI / 5; // Rotación total (positivo para ir hacia adelante)

  // --- Keyboard Controls ---
  const keys = {};
  const playerSpeed = 5;
  
  // Jump physics variables
  const originalPlayerY = player.y; // Posición inicial del suelo
  let isJumping = false;
  let jumpVelocity = 0;
  const jumpPower = -7; // Velocidad inicial del salto (negativa para ir hacia arriba)
  const gravity = 0.3; // Fuerza de gravedad
  let jumpPressed = false; // Para detectar cuando se presiona la tecla por primera vez

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    
    // Detectar cuando se presiona ArrowUp por primera vez para saltar
    if (e.code === "ArrowUp" && !jumpPressed && !isJumping) {
      isJumping = true;
      jumpVelocity = jumpPower;
      jumpPressed = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    
    // Resetear el estado de la tecla ArrowUp
    if (e.code === "ArrowUp") {
      jumpPressed = false;
    }
  });

  app.ticker.add((ticker) => {
    const delta = ticker.deltaTime;

    // Player horizontal movement only
    if (keys["ArrowLeft"]) player.x -= playerSpeed * delta;
    if (keys["ArrowRight"]) player.x += playerSpeed * delta;
    
    // Jump physics
    if (isJumping) {
      player.y += jumpVelocity * delta;
      jumpVelocity += gravity * delta; // Aplicar gravedad
      
      // Verificar si el jugador ha aterrizado
      if (player.y >= originalPlayerY) {
        player.y = originalPlayerY; // Asegurar que no pase del suelo
        isJumping = false;
        jumpVelocity = 0;
      }
    } else {
      // Asegurar que el jugador no baje más de la línea inicial
      if (player.y > originalPlayerY) {
        player.y = originalPlayerY;
      }
    }

    // Iniciar animación con la barra espaciadora
    if (keys["Space"] && !isKicking) {
      isKicking = true;
      currentFrame = 0;
    }

    // Kick animation
    if (isKicking) {
    currentFrame++;

    const maxHeight = 30;
    const forwardDistance = 10; // Distancia hacia adelante
    const preparationPush = 45; // Desplazamiento inicial hacia adelante

    if (currentFrame <= preparationFrames) {
    // Fase de preparación: solo empujar hacia adelante
    const prepProgress = currentFrame / preparationFrames;
    botin.x = originalBotinX - (preparationPush * prepProgress);
    botin.y = originalBotinY;
    botin.rotation = originalBotinRotation;
  }

    else if (currentFrame <= preparationFrames + kickFrames) {
    // Fase de patada: parábola + rotación
    const kickProgress = (currentFrame - preparationFrames) / kickFrames;

    const verticalOffset = 4 * maxHeight * kickProgress * (kickProgress - 1);
    botin.y = originalBotinY + verticalOffset;

    botin.x = originalBotinX - preparationPush - (forwardDistance * kickProgress);

    botin.rotation = originalBotinRotation + (Math.PI / 1.7) * Math.sin(kickProgress * Math.PI);
  }

    else if (currentFrame <= totalFrames) {
    // Fase de restauración: volver a la posición original
    const restoreProgress = (currentFrame - preparationFrames - kickFrames) / restorationFrames;
    botin.x = originalBotinX - preparationPush * (1 - restoreProgress);
    botin.y = originalBotinY;
    botin.rotation = originalBotinRotation;
  }

    else {
    // Fin de la animación
    isKicking = false;
    currentFrame = 0;
    botin.x = originalBotinX;
    botin.y = originalBotinY;
    botin.rotation = originalBotinRotation;
  }
}


    // Keep player within bounds
    player.x = Math.max(0, Math.min(app.screen.width - player.width, player.x));
    player.y = Math.max(0, Math.min(app.screen.height - player.height, player.y));
  });

})();