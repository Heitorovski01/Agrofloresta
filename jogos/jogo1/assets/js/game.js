import { Snake } from './snake.js';
import { Food } from './food.js';
import { saveScore, getLeaderboard } from './score.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 20;
    this.tileSize = canvas.width / this.gridSize;
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
    
    this.drawStartScreen();
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
    
    // Check and save High Score (Leaderboard logic)
    const leaderboard = getLeaderboard();
    const isTop5 = leaderboard.length < 5 || this.score > leaderboard[leaderboard.length - 1].score;
    
    if (isTop5 && this.score > 0) {
      let playerName = prompt("Parabéns! Você entrou no Top 5! Insira 3 letras para o seu nome:");
      if (playerName) {
        playerName = playerName.substring(0, 3).toUpperCase();
        saveScore(playerName, this.score);
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('agrofloresta_snake_highscore', this.highScore.toString());
      } catch (e) {
        console.warn("localStorage not available");
      }
    }
    
    this.drawGameOver();
    this.updateScoreDisplay(); // Update UI to show new high score
  }

  updateScoreDisplay() {
    const scoreElement = document.getElementById('scoreDisplay');
    if (scoreElement) {
      scoreElement.innerText = `Sementes colhidas: ${this.score} | Recorde: ${this.highScore}`;
    }
  }

  drawGameOver() {
    if (!this.ctx) return; // for tests
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px "Pixelify Sans", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('A terra precisa de você!', this.canvas.width / 2, this.canvas.height / 2 - 15);
    this.ctx.fillText('Tente de novo', this.canvas.width / 2, this.canvas.height / 2 + 15);
  }

  drawStartScreen() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px "Pixelify Sans", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Pressione Iniciar', this.canvas.width / 2, this.canvas.height / 2 - 80);
    
    // Leaderboard Display
    const leaderboard = getLeaderboard();
    this.ctx.font = '20px "Pixelify Sans", cursive';
    this.ctx.fillText('--- TOP 5 ---', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    if (leaderboard.length === 0) {
      this.ctx.font = '16px "Pixelify Sans", cursive';
      this.ctx.fillText('Nenhum recorde ainda', this.canvas.width / 2, this.canvas.height / 2);
    } else {
      this.ctx.font = '16px "Pixelify Sans", cursive';
      leaderboard.forEach((entry, index) => {
        this.ctx.fillText(`${index + 1}. ${entry.name} - ${entry.score}`, this.canvas.width / 2, this.canvas.height / 2 + (index * 20));
      });
    }
  }

  draw() {
    if (!this.isRunning && !this.isGameOver) {
      // Don't redraw loop if not running. Start screen is drawn on init.
      return;
    }
    
    if (this.isGameOver) return; // Wait to keep game over screen intact

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
    
    switch (this.food.type) {
      case 'pequi':
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.tileSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFC107'; // Yellow
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#FF8C00'; // Orange contour
        this.ctx.stroke();
        break;
      case 'buriti':
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, this.tileSize / 2 - 2, this.tileSize / 3, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#8B0000'; // Dark Red
        this.ctx.fill();
        break;
      case 'jatoba':
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, this.tileSize / 2 - 1, this.tileSize / 4, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#CD853F'; // Peru/Brown light
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#654321'; // Dark brown contour
        this.ctx.stroke();
        break;
      default:
        this.ctx.fillStyle = '#f5c842'; // fallback yellow
        this.ctx.fillRect(
          this.food.position.x * this.tileSize,
          this.food.position.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
    }

    // Draw snake body (Minhoca - Rosa terroso)
    for (let i = 0; i < this.snake.body.length; i++) {
      const segment = this.snake.body[i];
      const px = segment.x * this.tileSize;
      const py = segment.y * this.tileSize;
      
      // Base square
      this.ctx.fillStyle = i === 0 ? '#b35959' : '#d47b7b';
      this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
      
      // Volume/Shadow at the bottom
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.fillRect(px, py + this.tileSize - 4, this.tileSize, 4);
      
      // Eyes for the head
      if (i === 0) {
        this.ctx.fillStyle = 'black';
        // Simplified eyes assuming always looking one direction for now, or just default drawn
        // More complex would use snake direction
        this.ctx.beginPath();
        this.ctx.arc(px + 6, py + 6, 2, 0, Math.PI * 2);
        this.ctx.arc(px + this.tileSize - 6, py + 6, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  loop() {
    this.update();
    this.draw();
  }
}
