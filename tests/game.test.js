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
      fillStyle: ''
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
});
