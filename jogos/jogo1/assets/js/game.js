import { Snake } from './snake.js';
import { Food } from './food.js';
import { getTop3, checkIfTop3, saveToLeaderboard } from './score.js';
import { getAsset } from './assets.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridCols = 15;
    this.gridRows = 17;
    this.CELL_SIZE = 32;
    this.tileSize = this.CELL_SIZE;

    // High DPI Canvas Scaling
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.gridCols * this.CELL_SIZE}px`;
    this.canvas.style.height = `${this.gridRows * this.CELL_SIZE}px`;
    this.canvas.width = this.gridCols * this.CELL_SIZE * dpr;
    this.canvas.height = this.gridRows * this.CELL_SIZE * dpr;
    this.ctx.scale(dpr, dpr);

    this.logicalWidth = this.gridCols * this.tileSize;
    this.logicalHeight = this.gridRows * this.tileSize;

    this.snake = new Snake(10, 10);
    this.food = new Food(this.gridCols, this.gridRows);

    this.isRunning = false;
    this.isGameOver = false;
    this.score = 0;
    this.highScore = 0;
    this.rafId = null;
    this.tickRate = 150; // ms

    this.previousSnake = null;
    this.lastRenderTime = 0;
    this.accumulatedTime = 0;
    this.digesting = [];

    this.loadHighScore();

    this.handleInput = this.handleInput.bind(this);
    this.loop = this.loop.bind(this);
    this.handleSaveScore = this.handleSaveScore.bind(this);

    this.drawStartScreen();
    this.setupOverlayEvents();
  }

  setupOverlayEvents() {
    const saveBtn = document.getElementById('saveScoreBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', this.handleSaveScore);
    }
  }

  handleSaveScore() {
    const input = document.getElementById('playerNameInput');
    if (!input) return;

    let playerName = input.value.trim().substring(0, 3).toUpperCase();
    if (playerName.length === 0) playerName = 'AAA';

    saveToLeaderboard(playerName, this.score);

    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.add('hidden');

    this.updateLeaderboardUI();
    this.drawGameOver();
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('agrofloresta_snake_highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10);
      }
    } catch {
      console.warn('localStorage not available');
    }
  }

  restart() {
    this.stop();
    this.snake = new Snake(10, 10);
    this.food = new Food(this.gridCols, this.gridRows);
    this.isGameOver = false;
    this.score = 0;
    this.previousSnake = null;
    this.digesting = [];
    this.updateScoreDisplay();
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    window.addEventListener('keydown', this.handleInput);

    this.lastRenderTime = performance.now();
    this.accumulatedTime = 0;
    this.previousSnake = this.snake.body.map((s) => ({ x: s.x, y: s.y }));

    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.handleInput);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  handleInput(event) {
    const key = event.key.toLowerCase();
    let newDir = null;

    if (key === 'arrowup' || key === 'w') newDir = { x: 0, y: -1 };
    else if (key === 'arrowdown' || key === 's') newDir = { x: 0, y: 1 };
    else if (key === 'arrowleft' || key === 'a') newDir = { x: -1, y: 0 };
    else if (key === 'arrowright' || key === 'd') newDir = { x: 1, y: 0 };

    if (newDir) {
      // If stationary, start moving immediately on next animation frame
      const isStationary =
        this.snake.direction.x === 0 &&
        this.snake.direction.y === 0 &&
        this.snake.inputQueue.length === 0;

      this.snake.changeDirection(newDir);

      if (isStationary) {
        this.accumulatedTime = this.tickRate;
      }
    }
  }

  update() {
    if (this.isGameOver) return;

    this.snake.update();

    const head = this.snake.body[0];

    // Wall collision
    if (
      head.x < 0 ||
      head.x >= this.gridCols ||
      head.y < 0 ||
      head.y >= this.gridRows
    ) {
      this.triggerGameOver();
      return;
    }

    // Update digestion
    if (this.digesting) {
      for (let i = this.digesting.length - 1; i >= 0; i--) {
        this.digesting[i].index++;
        if (this.digesting[i].index >= this.snake.body.length) {
          this.digesting.splice(i, 1);
        }
      }
    }

    // Body collision
    for (let i = 1; i < this.snake.body.length; i++) {
      if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
        this.triggerGameOver();
        return;
      }
    }

    // Eating food
    if (head.x === this.food.position.x && head.y === this.food.position.y) {
      this.score += 1;
      this.snake.grow();
      if (!this.digesting) this.digesting = [];
      this.digesting.push({ index: 0, type: this.food.type });
      this.food.spawn(this.snake.body);
      this.updateScoreDisplay();
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.stop();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(
          'agrofloresta_snake_highscore',
          this.highScore.toString()
        );
      } catch {
        console.warn('localStorage not available');
      }
    }

    this.updateScoreDisplay();

    // Check Leaderboard logic
    if (checkIfTop3(this.score)) {
      const overlay = document.getElementById('gameOverOverlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        const input = document.getElementById('playerNameInput');
        if (input) {
          input.value = '';
          input.focus();
        }
        return; // Don't draw canvas game over yet, wait for save
      }
    }

    this.drawGameOver();
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById('scoreDisplay');
    if (scoreElement) {
      scoreElement.innerText = `Sementes colhidas: ${this.score} | Recorde: ${this.highScore}`;
    }
  }

  updateLeaderboardUI() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;

    const top3 = getTop3();
    list.innerHTML = '';

    if (top3.length === 0) {
      list.innerHTML = '<li>Nenhum recorde ainda</li>';
      return;
    }

    top3.forEach((entry, index) => {
      const li = document.createElement('li');
      li.innerText = `${index + 1}. ${entry.name} - ${entry.score}`;
      list.appendChild(li);
    });
  }

  drawGameOver() {
    if (!this.ctx) return; // for tests
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px "Pixelify Sans", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'A terra precisa de você!',
      this.logicalWidth / 2,
      this.logicalHeight / 2 - 15
    );
    this.ctx.fillText(
      'Tente de novo',
      this.logicalWidth / 2,
      this.logicalHeight / 2 + 15
    );
  }

  drawStartScreen() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px "Pixelify Sans", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'Pressione Iniciar',
      this.logicalWidth / 2,
      this.logicalHeight / 2
    );
  }

  draw(progress = 1.0) {
    if (!this.isRunning && !this.isGameOver) {
      // Don't redraw loop if not running. Start screen is drawn on init.
      return;
    }

    if (this.isGameOver) return; // Wait to keep game over screen intact

    // Clear canvas
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw Background Grid
    const gramaImg = getAsset('grama');
    if (gramaImg) {
      const pattern = this.ctx.createPattern(gramaImg, 'repeat');
      this.ctx.fillStyle = pattern;
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    } else {
      const colorA = '#8d9e5f'; // Cerrado grass 1
      const colorB = '#7a8c4c'; // Cerrado grass 2
      for (let row = 0; row < this.gridRows; row++) {
        for (let col = 0; col < this.gridCols; col++) {
          this.ctx.fillStyle = (row + col) % 2 === 0 ? colorA : colorB;
          this.ctx.fillRect(
            col * this.tileSize,
            row * this.tileSize,
            this.tileSize,
            this.tileSize
          );
        }
      }
    }

    // Draw food based on type
    const pxFood = this.food.position.x * this.tileSize;
    const pyFood = this.food.position.y * this.tileSize;
    const foodImg = getAsset(this.food.type);

    if (foodImg) {
      this.ctx.drawImage(foodImg, pxFood, pyFood, this.tileSize, this.tileSize);
    } else {
      const cx = pxFood + this.tileSize / 2;
      const cy = pyFood + this.tileSize / 2;
      const radius = this.tileSize / 2 - 2;

      switch (this.food.type) {
        case 'pequi': {
          const gradPequi = this.ctx.createRadialGradient(
            cx - radius * 0.3,
            cy - radius * 0.3,
            radius * 0.1,
            cx,
            cy,
            radius
          );
          gradPequi.addColorStop(0, '#FFF59D');
          gradPequi.addColorStop(0.5, '#FFC107');
          gradPequi.addColorStop(1, '#FF8C00');
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          this.ctx.fillStyle = gradPequi;
          this.ctx.fill();
          break;
        }
        case 'buriti': {
          this.ctx.beginPath();
          this.ctx.ellipse(
            cx,
            cy,
            radius * 0.9,
            radius * 1.1,
            0,
            0,
            Math.PI * 2
          );
          const gradBuriti = this.ctx.createRadialGradient(
            cx,
            cy,
            radius * 0.2,
            cx,
            cy,
            radius * 1.2
          );
          gradBuriti.addColorStop(0, '#B22222');
          gradBuriti.addColorStop(1, '#5C1515');
          this.ctx.fillStyle = gradBuriti;
          this.ctx.fill();
          this.ctx.strokeStyle = '#3A0D0D';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(cx - radius * 0.5, cy - radius * 0.4);
          this.ctx.lineTo(cx + radius * 0.5, cy + radius * 0.6);
          this.ctx.moveTo(cx + radius * 0.5, cy - radius * 0.4);
          this.ctx.lineTo(cx - radius * 0.5, cy + radius * 0.6);
          this.ctx.stroke();
          break;
        }
        case 'jatoba':
        case 'baru':
          this.ctx.beginPath();
          this.ctx.moveTo(cx - radius, cy);
          this.ctx.bezierCurveTo(
            cx - radius,
            cy - radius * 1.2,
            cx + radius,
            cy - radius * 1.2,
            cx + radius,
            cy
          );
          this.ctx.bezierCurveTo(
            cx + radius,
            cy + radius * 0.5,
            cx - radius,
            cy + radius * 0.5,
            cx - radius,
            cy
          );
          this.ctx.fillStyle = '#654321';
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.ellipse(
            cx,
            cy - radius * 0.3,
            radius * 0.5,
            radius * 0.15,
            0,
            0,
            Math.PI * 2
          );
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          this.ctx.fill();
          break;
        default:
          this.ctx.fillStyle = '#f5c842';
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          this.ctx.fill();
      }
    }

    // Draw snake body
    if (this.snake.body.length > 0) {
      const cabecaImg = getAsset('cabeca');
      const corpoImg = getAsset('corpo');

      if (cabecaImg && corpoImg) {
        // Sprite rendering
        for (let i = this.snake.body.length - 1; i >= 0; i--) {
          const segment = this.snake.body[i];
          const px = segment.x * this.tileSize;
          const py = segment.y * this.tileSize;

          if (i === 0) {
            // Draw Head with rotation
            const dirX = this.snake.direction.x || 1; // fallback to 1 if start 0,0
            const dirY = this.snake.direction.y || 0;
            // For a sprite that faces right by default:
            const angle = Math.atan2(dirY, dirX);
            // If the head sprite is drawn facing UP, we need angle = Math.atan2(dirY, dirX) + Math.PI/2.
            // Assuming it faces Right.

            this.ctx.save();
            this.ctx.translate(px + this.tileSize / 2, py + this.tileSize / 2);
            this.ctx.rotate(angle);
            this.ctx.drawImage(
              cabecaImg,
              -this.tileSize / 2,
              -this.tileSize / 2,
              this.tileSize,
              this.tileSize
            );
            this.ctx.restore();
          } else {
            // Draw Body
            this.ctx.drawImage(corpoImg, px, py, this.tileSize, this.tileSize);
          }
        }
      } else {
        // Fallback Cylindrical Path rendering
        const offset = this.CELL_SIZE / 2;
        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        // 1. Pre-calculate all segment coordinates
        const segmentCoords = [];
        for (let i = 0; i < this.snake.body.length; i++) {
          let prevSegX =
            this.previousSnake && i < this.previousSnake.length
              ? this.previousSnake[i].x
              : this.snake.body[i].x;
          let prevSegY =
            this.previousSnake && i < this.previousSnake.length
              ? this.previousSnake[i].y
              : this.snake.body[i].y;
          let cX = this.snake.body[i].x;
          let cY = this.snake.body[i].y;
          let vX = lerp(prevSegX, cX, progress) * this.CELL_SIZE + offset;
          let vY = lerp(prevSegY, cY, progress) * this.CELL_SIZE + offset;
          segmentCoords.push({ x: vX, y: vY });
        }

        // 2. Draw body (including head connection at index 0)
        if (segmentCoords.length > 0) {
          // Draw connecting body segments with tapering at the tail
          for (let i = segmentCoords.length - 1; i > 0; i--) {
            const pX = segmentCoords[i].x;
            const pY = segmentCoords[i].y;
            const prevX = segmentCoords[i - 1].x;
            const prevY = segmentCoords[i - 1].y;

            let baseWidth = this.CELL_SIZE * 0.85;
            if (segmentCoords.length > 4 && i > segmentCoords.length - 4) {
              const tailProgress = (segmentCoords.length - 1 - i) / 3;
              baseWidth = this.CELL_SIZE * (0.55 + 0.3 * tailProgress);
            }

            this.ctx.beginPath();
            this.ctx.strokeStyle = '#d68a7a'; // Worm base pink color
            this.ctx.lineWidth = baseWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.moveTo(prevX, prevY);
            this.ctx.lineTo(pX, pY);
            this.ctx.stroke();
          }

          // 3. Draw stripes (rings) along the body segments (except head)
          const drawStripe = (cx, cy, angle, baseWidth) => {
            const perp = angle + Math.PI / 2;
            const stripeLen = baseWidth * 0.44; // keep inside the body boundary
            const x1 = cx - Math.cos(perp) * stripeLen;
            const y1 = cy - Math.sin(perp) * stripeLen;
            const x2 = cx + Math.cos(perp) * stripeLen;
            const y2 = cy + Math.sin(perp) * stripeLen;

            this.ctx.beginPath();
            this.ctx.strokeStyle = '#b87567'; // Worm stripe color (darker pink/brown)
            this.ctx.lineWidth = 3.5;
            this.ctx.lineCap = 'round';
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
          };

          for (let i = 1; i < segmentCoords.length; i++) {
            const angle = Math.atan2(
              segmentCoords[i - 1].y - segmentCoords[i].y,
              segmentCoords[i - 1].x - segmentCoords[i].x
            );

            let baseWidth = this.CELL_SIZE * 0.85;
            if (segmentCoords.length > 4 && i > segmentCoords.length - 4) {
              const tailProgress = (segmentCoords.length - 1 - i) / 3;
              baseWidth = this.CELL_SIZE * (0.55 + 0.3 * tailProgress);
            }

            const spacing = this.CELL_SIZE * 0.22;
            drawStripe(
              segmentCoords[i].x - Math.cos(angle) * spacing,
              segmentCoords[i].y - Math.sin(angle) * spacing,
              angle,
              baseWidth
            );
            drawStripe(
              segmentCoords[i].x + Math.cos(angle) * spacing,
              segmentCoords[i].y + Math.sin(angle) * spacing,
              angle,
              baseWidth
            );
          }
        }

        // 4. Draw digesting lumps
        if (this.digesting && segmentCoords.length > 0) {
          for (let item of this.digesting) {
            let i = item.index;
            if (i >= segmentCoords.length) continue;

            let vX = segmentCoords[i].x;
            let vY = segmentCoords[i].y;

            this.ctx.beginPath();
            this.ctx.arc(vX, vY, this.CELL_SIZE * 0.55, 0, Math.PI * 2);

            let lumpColor = '#e39988'; // Default rosy mix
            if (item.type === 'pequi')
              lumpColor = '#e6c06a'; // Yellowish pink
            else if (item.type === 'buriti')
              lumpColor = '#c46666'; // Reddish pink
            else if (item.type === 'jatoba' || item.type === 'baru')
              lumpColor = '#a87a68'; // Brownish pink

            this.ctx.fillStyle = lumpColor;
            this.ctx.fill();
          }
        }

        // 5. Draw Head and Eyes
        if (segmentCoords.length > 0) {
          const headX = segmentCoords[0].x;
          const headY = segmentCoords[0].y;

          let headAngle = 0;
          const fX = this.food.position.x * this.CELL_SIZE + offset;
          const fY = this.food.position.y * this.CELL_SIZE + offset;
          const dist = Math.hypot(fX - headX, fY - headY);

          if (dist < this.CELL_SIZE * 2) {
            headAngle = Math.atan2(fY - headY, fX - headX);
          } else {
            const dirX = this.snake.direction.x;
            const dirY = this.snake.direction.y;
            if (dirX === 1) headAngle = 0;
            else if (dirX === -1) headAngle = Math.PI;
            else if (dirY === 1) headAngle = Math.PI / 2;
            else if (dirY === -1) headAngle = -Math.PI / 2;
          }

          this.ctx.beginPath();
          this.ctx.fillStyle = '#d68a7a';
          let headRadius = this.CELL_SIZE * 0.45;

          if (dist < this.CELL_SIZE * 2) {
            this.ctx.arc(
              headX,
              headY,
              headRadius,
              headAngle + 0.4,
              headAngle - 0.4,
              false
            );
            this.ctx.lineTo(headX, headY);
          } else {
            this.ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
          }
          this.ctx.fill();

          // Draw eyes relative to headAngle
          const eyeRadius = this.CELL_SIZE * 0.1;
          const eyeOffsetForward = this.CELL_SIZE * 0.15;
          const eyeOffsetSide = this.CELL_SIZE * 0.23;

          let eye1X =
            headX +
            Math.cos(headAngle) * eyeOffsetForward -
            Math.sin(headAngle) * eyeOffsetSide;
          let eye1Y =
            headY +
            Math.sin(headAngle) * eyeOffsetForward +
            Math.cos(headAngle) * eyeOffsetSide;

          let eye2X =
            headX +
            Math.cos(headAngle) * eyeOffsetForward +
            Math.sin(headAngle) * eyeOffsetSide;
          let eye2Y =
            headY +
            Math.sin(headAngle) * eyeOffsetForward -
            Math.cos(headAngle) * eyeOffsetSide;

          this.ctx.fillStyle = '#000';
          this.ctx.beginPath();
          this.ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.beginPath();
          this.ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
          this.ctx.fill();

          // Cute white highlight in the eyes!
          this.ctx.fillStyle = '#fff';
          this.ctx.beginPath();
          this.ctx.arc(
            eye1X - Math.cos(headAngle) * eyeRadius * 0.3,
            eye1Y - Math.sin(headAngle) * eyeRadius * 0.3,
            eyeRadius * 0.3,
            0,
            Math.PI * 2
          );
          this.ctx.arc(
            eye2X - Math.cos(headAngle) * eyeRadius * 0.3,
            eye2Y - Math.sin(headAngle) * eyeRadius * 0.3,
            eyeRadius * 0.3,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    }
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    if (typeof timestamp !== 'number') {
      timestamp = performance.now();
    }

    let dt = timestamp - this.lastRenderTime;
    this.lastRenderTime = timestamp;
    this.accumulatedTime += dt;

    // Fixed timestep update
    while (this.accumulatedTime >= this.tickRate) {
      this.previousSnake = this.snake.body.map((s) => ({ x: s.x, y: s.y }));
      this.update();
      this.accumulatedTime -= this.tickRate;

      if (!this.isRunning) break;
    }

    let progress = this.accumulatedTime / this.tickRate;
    if (progress > 1.0) progress = 1.0;
    if (progress < 0.0) progress = 0.0;

    this.draw(progress);

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  }
}
