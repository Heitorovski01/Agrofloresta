import { Snake } from './snake.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 20;
    this.tileSize = canvas.width / this.gridSize;
    this.snake = new Snake(10, 10);
    this.isRunning = false;
    this.intervalId = null;
    this.tickRate = 150; // ms

    this.handleInput = this.handleInput.bind(this);
    this.loop = this.loop.bind(this);
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
    this.snake.update();
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw snake body (Agroforestry theme - colors will be styled later via ctx or CSS, for now basic green)
    this.ctx.fillStyle = '#4caf50'; // var(--green-light) from main.css
    
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
