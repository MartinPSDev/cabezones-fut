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
  const ballTexture = await Assets.load("assets/brazuca.png");

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
  
  const ball = new Sprite(ballTexture);
  const ballScale = (head.width / ball.texture.width) * 0.7;
  ball.width = ball.texture.width * ballScale;
  ball.height = ball.texture.height * ballScale;
  ball.anchor.set(0.5, 0.5);
  ball.x = app.screen.width / 2;
  ball.y = app.screen.height / 2 + 246; // Ajustar la posición vertical para que esté alineada con el jugado

  // Agrega la pelota al escenario antes o después del jugador según el orden visual deseado
  app.stage.addChild(ball);

  // Ball physics properties
  let ballVelocityX = 0;
  let ballVelocityY = 0;
  const ballGravity = 0.5;
  const ballFriction = 0.98;
  const ballBounce = 0.7;
  const groundY = app.screen.height / 2 + 246; // Nivel del suelo para la pelota
  let ballHasBeenKicked = false;

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
    const preparationPush = 44; // Desplazamiento inicial hacia adelante

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
    
    // Detección de colisión con la pelota durante la patada
    if (!ballHasBeenKicked) {
      // Calcular posición mundial de la bota
      const bootWorldX = player.x + (botin.x * player.scale.x);
      const bootWorldY = player.y + (botin.y * player.scale.y);
      
      // Calcular distancia entre la bota y la pelota
      const distanceX = ball.x - bootWorldX;
      const distanceY = ball.y - bootWorldY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      // Si la bota está cerca de la pelota (colisión)
      if (distance < 40) {
        ballHasBeenKicked = true;
        
        // Calcular dirección y fuerza del golpe
        const kickPower = 15 + (kickProgress * 10); // Fuerza variable según el momento del golpe
        const angle = Math.atan2(distanceY, distanceX);
        
        // Aplicar velocidad a la pelota
        ballVelocityX = Math.cos(angle) * kickPower;
        ballVelocityY = Math.sin(angle) * kickPower - 5; // Añadir componente hacia arriba
      }
    }
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
    ballHasBeenKicked = false; // Resetear para permitir otro golpe
  }
}


    // Keep player within bounds
    player.x = Math.max(0, Math.min(app.screen.width - player.width, player.x));
    player.y = Math.max(0, Math.min(app.screen.height - player.height, player.y));
    
    // Detección de colisión mejorada entre el jugador y la pelota
    const nucaOffset = -38; // Ajusta este valor según lo que necesites
    const headWorldX = player.x + (head.x * player.scale.x) - nucaOffset;
    const headWorldY = player.y + (head.y * player.scale.y);
    
    const headDistanceX = ball.x - headWorldX;
    const headDistanceY = ball.y - headWorldY;
    const headDistance = Math.sqrt(headDistanceX * headDistanceX + headDistanceY * headDistanceY);
    
    // Radio de colisión más amplio para evitar que la pelota atraviese
    const collisionRadius = 57;
    
    // Si hay colisión con la cabeza desde cualquier dirección
    if (headDistance < collisionRadius) {
      // Calcular dirección del rebote basada en la posición relativa
      const angle = Math.atan2(headDistanceY, headDistanceX);
      
      // Determinar si es un golpe intencional (jugador en movimiento) o rebote pasivo
      const playerIsMoving = Math.abs(ballVelocityX) > 0.5 || Math.abs(ballVelocityY) > 0.5 || 
                            keys["ArrowLeft"] || keys["ArrowRight"] || isJumping;
      
      let headPower;
      if (playerIsMoving) {
        // Cabezazo intencional - más potencia
        headPower = isJumping ? 11 : 4.5; // Más fuerte si está saltando
      } else {
        // Rebote pasivo - mantener velocidad existente pero cambiar dirección
        headPower = Math.sqrt(ballVelocityX * ballVelocityX + ballVelocityY * ballVelocityY) * 0.01;
        headPower = Math.max(headPower, 0.01); // Rebote mínimo aún más suave
      }
      
      // Aplicar nueva velocidad a la pelota
      ballVelocityX = Math.cos(angle) * headPower;
      ballVelocityY = Math.sin(angle) * headPower;
      
      // Añadir componente hacia arriba solo si viene desde abajo
      if (headDistanceY < 0) {
        ballVelocityY -= 3;
      }
      
      // Separar la pelota del jugador para evitar colisiones múltiples
      const separationDistance = collisionRadius + 5;
      ball.x = headWorldX + Math.cos(angle) * separationDistance;
      ball.y = headWorldY + Math.sin(angle) * separationDistance;
    }
    
    // Ball physics
    if (Math.abs(ballVelocityX) > 0.1 || Math.abs(ballVelocityY) > 0.1 || ball.y < groundY) {
      // Aplicar velocidad a la posición
      ball.x += ballVelocityX * delta;
      ball.y += ballVelocityY * delta;
      
      // Aplicar gravedad
      ballVelocityY += ballGravity * delta;
      
      // Aplicar fricción horizontal
      ballVelocityX *= ballFriction;
      
      // Rebote en el suelo
      if (ball.y >= groundY) {
        ball.y = groundY;
        ballVelocityY *= -ballBounce; // Rebote con pérdida de energía
        ballVelocityX *= ballFriction; // Fricción adicional al tocar el suelo
        
        // Detener la pelota si la velocidad es muy baja
        if (Math.abs(ballVelocityY) < 2) {
          ballVelocityY = 0;
        }
      }
      
      // Rebotes en los bordes de la pantalla
      if (ball.x <= ball.width/2) {
        ball.x = ball.width/2;
        ballVelocityX *= -ballBounce;
      } else if (ball.x >= app.screen.width - ball.width/2) {
        ball.x = app.screen.width - ball.width/2;
        ballVelocityX *= -ballBounce;
      }
      
      // Rotación realística de la pelota en su propio eje
      const totalVelocity = Math.sqrt(ballVelocityX * ballVelocityX + ballVelocityY * ballVelocityY);
      ball.rotation += (totalVelocity * 0.06) * delta; // Rotación basada en velocidad total
    }
  });


 
})();