import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../jogos/jogo1/assets/js/game.js';

describe('Game Loop and Rendering', () => {
  let game;
  let mockCtx;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    // Mock canvas context
    mockCtx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      scale: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillStyle: '',
      font: '',
      textAlign: '',
      lineWidth: 1,
      strokeStyle: '',
      lineCap: '',
      lineJoin: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0
    };

    const mockCanvas = {
      getContext: vi.fn(() => mockCtx),
      width: 400,
      height: 400,
      style: {}
    };

    // We pass the mock canvas directly for testing
    game = new Game(mockCanvas);
  });

  it('should initialize with correct properties and draw start screen', () => {
    expect(game.gridCols).toBe(15);
    expect(game.gridRows).toBe(17);
    expect(game.tileSize).toBe(32);
    expect(game.snake).toBeDefined();
    expect(game.isRunning).toBe(false);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Pressione Iniciar', 240, 272);
  });

  it('should start and stop the loop', () => {
    vi.useFakeTimers();
    game.start();
    expect(game.isRunning).toBe(true);
    expect(game.rafId).toBeDefined();

    game.stop();
    expect(game.isRunning).toBe(false);
    expect(game.rafId).toBeNull();
    vi.useRealTimers();
  });

  it('should render the game state correctly', () => {
    // Draw without start screen interference
    game.isRunning = true;
    game.draw();
    // It should clear the canvas logical bounds (15 * 32 = 480, 17 * 32 = 544)
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 480, 544);
    // It should call stroke to draw the snake path
    expect(mockCtx.stroke).toHaveBeenCalled();
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
    game.snake.body[0] = { x: 15, y: 10 }; // Outside right bounds
    game.update();
    expect(game.isGameOver).toBe(true);

    game.isGameOver = false;
    game.snake.body[0] = { x: 10, y: -1 }; // Outside top bounds
    game.update();
    expect(game.isGameOver).toBe(true);

    game.isGameOver = false;
    game.snake.body[0] = { x: 10, y: 17 }; // Outside bottom bounds
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
    game.food.position = { x: 11, y: 10 };
    game.snake.body[0] = { x: 10, y: 10 };
    game.snake.changeDirection({ x: 1, y: 0 }); // Moving right
    game.update();
    expect(game.score).toBe(1);
    expect(game.snake.growing).toBe(true);
    expect(game.food.position).not.toEqual({ x: 11, y: 10 });
  });

  it('should update high score, trigger DOM overlay for Top 3, and save', () => {
    // Mock localStorage for leaderboard
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'agro_leaderboard') return JSON.stringify([{name: 'AAA', score: 3}]);
        return '5'; // highscore
      }),
      setItem: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
    
    // Mock DOM elements
    const mockOverlay = { classList: { remove: vi.fn(), add: vi.fn() } };
    const mockInput = { value: 'XYZ', focus: vi.fn() };
    const mockScoreElement = { innerText: '' };
    const mockLeaderboardList = { innerHTML: '', appendChild: vi.fn() };
    
    vi.stubGlobal('document', {
      getElementById: vi.fn((id) => {
        if (id === 'gameOverOverlay') return mockOverlay;
        if (id === 'playerNameInput') return mockInput;
        if (id === 'scoreDisplay') return mockScoreElement;
        if (id === 'leaderboardList') return mockLeaderboardList;
        return null;
      }),
      createElement: vi.fn(() => ({ innerText: '' }))
    });

    // Initial load high score
    game.loadHighScore();
    expect(game.highScore).toBe(5);

    // Play and get score 10
    game.score = 10;
    
    // Trigger game over (wall collision)
    game.snake.body[0] = { x: -1, y: 10 };
    game.update();
    
    expect(game.isGameOver).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('agrofloresta_snake_highscore', '10');
    expect(game.highScore).toBe(10);

    // Assert that overlay was shown instead of canvas drawing
    expect(mockOverlay.classList.remove).toHaveBeenCalledWith('hidden');
    // The canvas game over text should not be drawn yet
    expect(mockCtx.fillText).not.toHaveBeenCalledWith('A terra precisa de você!', 240, 257);

    // Simulate saving the score
    game.handleSaveScore();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('agro_leaderboard', expect.any(String));
    expect(mockOverlay.classList.add).toHaveBeenCalledWith('hidden');
    // logical width / 2 = 240, height / 2 - 15 = 257
    expect(mockCtx.fillText).toHaveBeenCalledWith('A terra precisa de você!', 240, 257);
  });

  it('should skip overlay and draw game over if not Top 3', () => {
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'agro_leaderboard') return JSON.stringify([
          {name: 'AAA', score: 100},
          {name: 'BBB', score: 90},
          {name: 'CCC', score: 80}
        ]);
        return '5';
      }),
      setItem: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
    
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => null)
    });

    game.score = 10; // Not top 3
    game.triggerGameOver();
    
    // Overlay logic skipped, canvas drawn immediately
    expect(mockCtx.fillText).toHaveBeenCalledWith('A terra precisa de você!', 240, 257);
  });

  it('should reset state on restart', () => {
    game.isGameOver = true;
    game.score = 10;
    game.snake.body = [{ x: 5, y: 5 }, { x: 4, y: 5 }]; // changed body
    game.snake.direction = { x: 1, y: 0 };
    
    game.restart();
    
    expect(game.isGameOver).toBe(false);
    expect(game.score).toBe(0);
    expect(game.snake.body.length).toBe(1);
    expect(game.snake.body[0]).toEqual({ x: 10, y: 10 });
    expect(game.snake.direction).toEqual({ x: 0, y: 0 });
  });
});
