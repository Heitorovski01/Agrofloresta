import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../jogos/jogo1/assets/js/game.js';

describe('Game Loop and Rendering', () => {
  let game;
  let mockCtx;

  beforeEach(() => {
    // Mock canvas context
    mockCtx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      font: '',
      textAlign: ''
    };

    const mockCanvas = {
      getContext: vi.fn(() => mockCtx),
      width: 400,
      height: 400
    };

    // We pass the mock canvas directly for testing
    game = new Game(mockCanvas);
  });

  it('should initialize with correct properties', () => {
    expect(game.gridSize).toBe(20);
    expect(game.tileSize).toBe(20); // 400 / 20 = 20
    expect(game.snake).toBeDefined();
    expect(game.isRunning).toBe(false);
  });

  it('should start and stop the loop', () => {
    vi.useFakeTimers();
    game.start();
    expect(game.isRunning).toBe(true);
    expect(game.intervalId).toBeDefined();

    game.stop();
    expect(game.isRunning).toBe(false);
    expect(game.intervalId).toBeNull();
    vi.useRealTimers();
  });

  it('should render the game state correctly', () => {
    game.draw();
    // It should clear the canvas
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 400, 400);
    // It should draw the snake (1 part by default at 10,10)
    expect(mockCtx.fillRect).toHaveBeenCalledWith(10 * 20, 10 * 20, 20, 20);
  });

  it('should handle keyboard input', () => {
    game.handleInput({ key: 'ArrowRight' });
    expect(game.snake.nextDirection).toEqual({ x: 1, y: 0 });

    game.handleInput({ key: 'ArrowDown' });
    expect(game.snake.nextDirection).toEqual({ x: 0, y: 1 });

    game.handleInput({ key: 'a' }); // WASD support
    expect(game.snake.nextDirection).toEqual({ x: -1, y: 0 });

    game.handleInput({ key: 'w' });
    expect(game.snake.nextDirection).toEqual({ x: 0, y: -1 });
  });

  it('should handle wall collision (Game Over)', () => {
    game.snake.body[0] = { x: -1, y: 10 }; // Outside left bounds
    game.update();
    expect(game.isGameOver).toBe(true);

    game.isGameOver = false;
    game.snake.body[0] = { x: 20, y: 10 }; // Outside right bounds
    game.update();
    expect(game.isGameOver).toBe(true);

    game.isGameOver = false;
    game.snake.body[0] = { x: 10, y: -1 }; // Outside top bounds
    game.update();
    expect(game.isGameOver).toBe(true);

    game.isGameOver = false;
    game.snake.body[0] = { x: 10, y: 20 }; // Outside bottom bounds
    game.update();
    expect(game.isGameOver).toBe(true);
  });

  it('should handle body collision (Game Over)', () => {
    // Make snake head intersect with body
    game.snake.body = [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 11, y: 11 },
      { x: 10, y: 11 },
      { x: 10, y: 10 } // Tail is on same spot as head
    ];
    game.update();
    expect(game.isGameOver).toBe(true);
  });

  it('should eat food, increase score, and grow', () => {
    // Place food right where snake head is moving
    game.food.position = { x: 11, y: 10 };
    game.snake.body[0] = { x: 10, y: 10 };
    game.snake.changeDirection({ x: 1, y: 0 }); // Moving right
    
    // Call update, snake will move to 11,10 and eat the food
    game.update();
    
    expect(game.score).toBe(1);
    expect(game.snake.growing).toBe(true);
    // Food position should change
    expect(game.food.position).not.toEqual({ x: 11, y: 10 });
  });
});
