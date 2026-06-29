import { Snake } from './snake.js';
import { Food } from './food.js';
import { getTop3, checkIfTop3, saveToLeaderboard } from './score.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 20;
    this.CELL_SIZE = 32;
    this.tileSize = this.CELL_SIZE;
    
    // High DPI Canvas Scaling
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.gridSize * this.CELL_SIZE}px`;
    this.canvas.style.height = `${this.gridSize * this.CELL_SIZE}px`;
    this.canvas.width = this.gridSize * this.CELL_SIZE * dpr;
    this.canvas.height = this.gridSize * this.CELL_SIZE * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.logicalWidth = this.gridSize * this.tileSize;
    this.logicalHeight = this.gridSize * this.tileSize;

    this.snake = new Snake(10, 10);
    this.food = new Food(this.gridSize);
    this.isRunning = false;
    this.isGameOver = false;
    this.score = 0;
    this.highScore = 0;
    this.intervalId = null;
    this.tickRate = 150; // ms

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
    } catch (e) {
      console.warn("localStorage not available");
    }
  }

  restart() {
    this.stop();
    this.snake = new Snake(10, 10);
    this.food = new Food(this.gridSize);
    this.isGameOver = false;
    this.score = 0;
    this.updateScoreDisplay();
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    window.addEventListener('keydown', this.handleInput);
    this.intervalId = setInterval(this.loop, this.tickRate);
  }

  stop() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.handleInput);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
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
      this.snake.changeDirection(newDir);
    }
  }

  update() {
    if (this.isGameOver) return;

    this.snake.update();

    const head = this.snake.body[0];

    // Wall collision
    if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
      this.triggerGameOver();
      return;
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
        localStorage.setItem('agrofloresta_snake_highscore', this.highScore.toString());
      } catch (e) {
        console.warn("localStorage not available");
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
    this.ctx.fillText('A terra precisa de você!', this.logicalWidth / 2, this.logicalHeight / 2 - 15);
    this.ctx.fillText('Tente de novo', this.logicalWidth / 2, this.logicalHeight / 2 + 15);
  }

  drawStartScreen() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px "Pixelify Sans", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Pressione Iniciar', this.logicalWidth / 2, this.logicalHeight / 2);
  }

  draw() {
    if (!this.isRunning && !this.isGameOver) {
      // Don't redraw loop if not running. Start screen is drawn on init.
      return;
    }
    
    if (this.isGameOver) return; // Wait to keep game over screen intact

    // Clear canvas
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw Background Grid (Solo da Roça)
    const colorA = '#8B5A2B'; // Darker soil
    const colorB = '#9C6631'; // Lighter soil
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.ctx.fillStyle = (row + col) % 2 === 0 ? colorA : colorB;
        this.ctx.fillRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    // Draw food based on type
    const cx = this.food.position.x * this.tileSize + this.tileSize / 2;
    const cy = this.food.position.y * this.tileSize + this.tileSize / 2;
    const radius = this.tileSize / 2 - 2;
    
    // Fallback drawImage placeholder structure:
    // const img = new Image(); img.src = 'path.png'; this.ctx.drawImage(img, cx - radius, cy - radius, this.tileSize, this.tileSize);
    
    switch (this.food.type) {
      case 'pequi':
        const gradPequi = this.ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, radius*0.1, cx, cy, radius);
        gradPequi.addColorStop(0, '#FFF59D');
        gradPequi.addColorStop(0.5, '#FFC107');
        gradPequi.addColorStop(1, '#FF8C00');
        
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradPequi;
        this.ctx.fill();
        break;

      case 'buriti':
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, radius * 0.9, radius * 1.1, 0, 0, Math.PI * 2); 
        
        const gradBuriti = this.ctx.createRadialGradient(cx, cy, radius*0.2, cx, cy, radius*1.2);
        gradBuriti.addColorStop(0, '#B22222');
        gradBuriti.addColorStop(1, '#5C1515');

        this.ctx.fillStyle = gradBuriti;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#3A0D0D';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - radius*0.5, cy - radius*0.4); this.ctx.lineTo(cx + radius*0.5, cy + radius*0.6);
        this.ctx.moveTo(cx + radius*0.5, cy - radius*0.4); this.ctx.lineTo(cx - radius*0.5, cy + radius*0.6);
        this.ctx.stroke();
        break;

      case 'jatoba':
      case 'baru':
        this.ctx.beginPath();
        this.ctx.moveTo(cx - radius, cy);
        this.ctx.bezierCurveTo(cx - radius, cy - radius*1.2, cx + radius, cy - radius*1.2, cx + radius, cy);
        this.ctx.bezierCurveTo(cx + radius, cy + radius*0.5, cx - radius, cy + radius*0.5, cx - radius, cy);
        
        this.ctx.fillStyle = '#654321';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy - radius*0.3, radius*0.5, radius*0.15, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fill();
        break;

      default:
        this.ctx.fillStyle = '#f5c842';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Draw snake body (Cylindrical Path)
    if (this.snake.body.length > 0) {
      const offset = this.tileSize / 2;
      
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#d47b7b';
      this.ctx.lineWidth = this.tileSize * 0.8;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      // Shadow for organic feel
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;
      
      this.ctx.moveTo(
        this.snake.body[0].x * this.tileSize + offset,
        this.snake.body[0].y * this.tileSize + offset
      );
      
      for (let i = 1; i < this.snake.body.length; i++) {
        this.ctx.lineTo(
          this.snake.body[i].x * this.tileSize + offset,
          this.snake.body[i].y * this.tileSize + offset
        );
      }
      this.ctx.stroke();

      // Reset shadow for the head details
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;

      // Head details
      const headX = this.snake.body[0].x * this.tileSize + offset;
      const headY = this.snake.body[0].y * this.tileSize + offset;
      
      this.ctx.fillStyle = '#b35959'; 
      this.ctx.beginPath();
      this.ctx.arc(headX, headY, this.tileSize * 0.35, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'black';
      this.ctx.beginPath();
      this.ctx.arc(headX - this.tileSize * 0.15, headY - this.tileSize * 0.1, this.tileSize * 0.08, 0, Math.PI * 2);
      this.ctx.arc(headX + this.tileSize * 0.15, headY - this.tileSize * 0.1, this.tileSize * 0.08, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  loop() {
    this.update();
    this.draw();
  }
}
