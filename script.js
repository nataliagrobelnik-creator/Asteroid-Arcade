(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const config = {
    friction: 0.992,
    rotationSpeed: 3.8,
    thrustPower: 210,
    bulletSpeed: 520,
    bulletLife: 1.2,
    fireCooldown: 0.15,
    shipRadius: 14,
    maxLives: 3,
    asteroidBaseSpeed: 42,
    asteroidSpeedVariance: 28,
    asteroidSizes: [52, 34, 20],
    invulnerabilityTime: 2,
  };

  const state = {
    ship: null,
    asteroids: [],
    bullets: [],
    particles: [],
    score: 0,
    lives: config.maxLives,
    gameOver: false,
    wave: 1,
    lastTime: 0,
    shootCooldown: 0,
    input: { left: false, right: false, thrust: false, shoot: false },
  };

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function wrapPosition(entity) {
    if (entity.x < 0) entity.x += canvas.width;
    if (entity.x > canvas.width) entity.x -= canvas.width;
    if (entity.y < 0) entity.y += canvas.height;
    if (entity.y > canvas.height) entity.y -= canvas.height;
  }

  function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function createShip() {
    return {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      radius: config.shipRadius,
      invulnerable: config.invulnerabilityTime,
      thrustVisual: 0,
    };
  }

  function spawnAsteroid(sizeIndex, x, y) {
    const radius = config.asteroidSizes[sizeIndex];
    const angle = random(0, Math.PI * 2);
    const speed = config.asteroidBaseSpeed + random(-config.asteroidSpeedVariance, config.asteroidSpeedVariance);

    // Für einen organischen Look nutzen wir leicht unregelmäßige Kantenpunkte.
    const points = Array.from({ length: 10 }, (_, i) => {
      const theta = (i / 10) * Math.PI * 2;
      return {
        angle: theta,
        r: radius * random(0.72, 1.12),
      };
    });

    state.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      sizeIndex,
      points,
      spin: random(-1.2, 1.2),
      angle: random(0, Math.PI * 2),
    });
  }

  function spawnWave() {
    const amount = Math.min(3 + state.wave, 8);
    for (let i = 0; i < amount; i += 1) {
      let x;
      let y;
      do {
        x = random(0, canvas.width);
        y = random(0, canvas.height);
      } while (distanceSquared({ x, y }, state.ship) < 180 * 180);
      spawnAsteroid(0, x, y);
    }
  }

  function spawnExplosion(x, y, color = "#98f0ff", strength = 10) {
    for (let i = 0; i < strength; i += 1) {
      const angle = random(0, Math.PI * 2);
      const speed = random(40, 180);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: random(0.2, 0.6),
        maxLife: 0.6,
        color,
      });
    }
  }

  function resetGame() {
    state.ship = createShip();
    state.asteroids = [];
    state.bullets = [];
    state.particles = [];
    state.score = 0;
    state.lives = config.maxLives;
    state.gameOver = false;
    state.wave = 1;
    state.shootCooldown = 0;
    spawnWave();
  }

  function fireBullet() {
    const ship = state.ship;
    const noseX = ship.x + Math.cos(ship.angle) * ship.radius;
    const noseY = ship.y + Math.sin(ship.angle) * ship.radius;

    state.bullets.push({
      x: noseX,
      y: noseY,
      vx: Math.cos(ship.angle) * config.bulletSpeed + ship.vx,
      vy: Math.sin(ship.angle) * config.bulletSpeed + ship.vy,
      life: config.bulletLife,
    });

    ship.thrustVisual = Math.max(ship.thrustVisual, 0.15);
  }

  function splitAsteroid(asteroid) {
    const nextSize = asteroid.sizeIndex + 1;
    if (nextSize < config.asteroidSizes.length) {
      spawnAsteroid(nextSize, asteroid.x + random(-8, 8), asteroid.y + random(-8, 8));
      spawnAsteroid(nextSize, asteroid.x + random(-8, 8), asteroid.y + random(-8, 8));
    }
  }

  function handleInput(dt) {
    const ship = state.ship;
    if (state.input.left) ship.angle -= config.rotationSpeed * dt;
    if (state.input.right) ship.angle += config.rotationSpeed * dt;

    if (state.input.thrust) {
      ship.vx += Math.cos(ship.angle) * config.thrustPower * dt;
      ship.vy += Math.sin(ship.angle) * config.thrustPower * dt;
      ship.thrustVisual = 0.08;
    }

    if (state.shootCooldown > 0) {
      state.shootCooldown -= dt;
    }

    if (state.input.shoot && state.shootCooldown <= 0) {
      fireBullet();
      state.shootCooldown = config.fireCooldown;
    }
  }

  function updateEntities(dt) {
    const ship = state.ship;

    ship.vx *= config.friction;
    ship.vy *= config.friction;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.thrustVisual = Math.max(0, ship.thrustVisual - dt);
    ship.invulnerable = Math.max(0, ship.invulnerable - dt);
    wrapPosition(ship);

    for (let i = state.asteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = state.asteroids[i];
      asteroid.x += asteroid.vx * dt;
      asteroid.y += asteroid.vy * dt;
      asteroid.angle += asteroid.spin * dt;
      wrapPosition(asteroid);
    }

    for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = state.bullets[i];
      bullet.life -= dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      wrapPosition(bullet);
      if (bullet.life <= 0) {
        state.bullets.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function handleCollisions() {
    // Schüsse vs Asteroiden
    for (let b = state.bullets.length - 1; b >= 0; b -= 1) {
      const bullet = state.bullets[b];
      let bulletConsumed = false;

      for (let a = state.asteroids.length - 1; a >= 0; a -= 1) {
        const asteroid = state.asteroids[a];
        const hitDist = asteroid.radius + 2;
        if (distanceSquared(bullet, asteroid) <= hitDist * hitDist) {
          state.bullets.splice(b, 1);
          state.asteroids.splice(a, 1);
          splitAsteroid(asteroid);
          spawnExplosion(asteroid.x, asteroid.y, "#98f0ff", 12);
          state.score += (3 - asteroid.sizeIndex) * 100;
          bulletConsumed = true;
          break;
        }
      }

      if (bulletConsumed) continue;
    }

    // Schiff vs Asteroiden
    const ship = state.ship;
    if (ship.invulnerable > 0 || state.gameOver) return;

    for (let a = state.asteroids.length - 1; a >= 0; a -= 1) {
      const asteroid = state.asteroids[a];
      const hitDist = ship.radius + asteroid.radius * 0.85;
      if (distanceSquared(ship, asteroid) <= hitDist * hitDist) {
        state.lives -= 1;
        spawnExplosion(ship.x, ship.y, "#ff7a7a", 18);

        if (state.lives <= 0) {
          state.gameOver = true;
        }

        state.ship = createShip();
        return;
      }
    }
  }

  function ensureWaveProgression() {
    if (!state.gameOver && state.asteroids.length === 0) {
      state.wave += 1;
      state.ship.invulnerable = 1.2;
      spawnWave();
    }
  }

  function drawShip(ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    const blink = ship.invulnerable > 0 && Math.floor(ship.invulnerable * 10) % 2 === 0;
    ctx.strokeStyle = blink ? "#4a6d79" : "#f5e06e";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();

    if (state.input.thrust || ship.thrustVisual > 0) {
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-20, random(-5, 5));
      ctx.lineTo(-12, 0);
      ctx.strokeStyle = "#ff7a7a";
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);
    ctx.strokeStyle = "#98f0ff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    asteroid.points.forEach((point, index) => {
      const px = Math.cos(point.angle) * point.r;
      const py = Math.sin(point.angle) * point.r;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawHud() {
    ctx.fillStyle = "#e7f8ff";
    ctx.font = "20px monospace";
    ctx.fillText(`Score: ${state.score}`, 16, 28);
    ctx.fillText(`Leben: ${state.lives}`, 16, 56);
    ctx.fillText(`Welle: ${state.wave}`, 16, 84);

    if (state.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff7a7a";
      ctx.font = "bold 64px monospace";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = "#e7f8ff";
      ctx.font = "22px monospace";
      ctx.fillText("Drücke Enter zum Neustart", canvas.width / 2, canvas.height / 2 + 35);
      ctx.textAlign = "left";
    }
  }

  function render() {
    ctx.fillStyle = "#02050a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Einfache Sternenpunkte für etwas Tiefe.
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    for (let i = 0; i < 45; i += 1) {
      const x = (i * 197.37) % canvas.width;
      const y = (i * 331.57) % canvas.height;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    state.asteroids.forEach(drawAsteroid);

    ctx.fillStyle = "#ffffff";
    state.bullets.forEach((bullet) => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    state.particles.forEach((particle) => {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color.replace(")",
        `, ${alpha})`).replace("rgb", "rgba");
      if (!particle.color.startsWith("rgb")) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
      }
      ctx.fillRect(particle.x, particle.y, 2, 2);
      ctx.globalAlpha = 1;
    });

    if (!state.gameOver) {
      drawShip(state.ship);
    }

    drawHud();
  }

  function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
    state.lastTime = timestamp;

    if (!state.gameOver) {
      handleInput(dt);
      updateEntities(dt);
      handleCollisions();
      ensureWaveProgression();
    }

    render();
    requestAnimationFrame(loop);
  }

  function setupInput() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "ArrowLeft") state.input.left = true;
      if (event.code === "ArrowRight") state.input.right = true;
      if (event.code === "ArrowUp") state.input.thrust = true;
      if (event.code === "Space") state.input.shoot = true;

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
        event.preventDefault();
      }

      if (event.code === "Enter" && state.gameOver) {
        resetGame();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowLeft") state.input.left = false;
      if (event.code === "ArrowRight") state.input.right = false;
      if (event.code === "ArrowUp") state.input.thrust = false;
      if (event.code === "Space") state.input.shoot = false;
    });
  }

  // Startsequenz
  resetGame();
  setupInput();
  requestAnimationFrame(loop);
})();
