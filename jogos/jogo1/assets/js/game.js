import { Snake } from './snake.js';
import { Food } from './food.js';

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
    
    // Check and save High Score
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
    this.ctx.fillText('Pressione Iniciar', this.canvas.width / 2, this.canvas.height / 2);
  }

  draw() {
    if (!this.isRunning && !this.isGameOver) {
      // Don't redraw loop if not running. Start screen is drawn on init.
      return;
    }
    
    if (this.isGameOver) return; // Wait to keep game over screen intact

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw food
    this.ctx.fillStyle = '#f5c842'; // var(--yellow) from main.css for now
    this.ctx.fillRect(
      this.food.position.x * this.tileSize,
      this.food.position.y * this.tileSize,
      this.tileSize,
      this.tileSize
    );

    // Draw snake body
    this.ctx.fillStyle = '#4caf50'; // var(--green-light)
    
    for (const segment of this.snake.body) {
      this.ctx.fillRect(
        segment.x * this.tileSize, 
        segment.y * this.tileSize, 
        this.tileSize, 
        this.tileSize
      );
    }
  }

  loop() {
    this.update();
    this.draw();
  }
}
