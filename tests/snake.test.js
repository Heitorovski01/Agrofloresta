import { describe, it, expect, beforeEach } from 'vitest';
import { Snake } from '../jogos/jogo1/assets/js/snake.js';

describe('Snake Logic', () => {
  let snake;

  beforeEach(() => {
    snake = new Snake(10, 10); // Start at center of 20x20 grid
  });

  it('should initialize with correct default body and direction', () => {
    expect(snake.body).toEqual([{ x: 10, y: 10 }]);
    expect(snake.direction).toEqual({ x: 0, y: 0 }); // Initially stopped
  });

  it('should change direction', () => {
    snake.changeDirection({ x: 1, y: 0 });
    expect(snake.nextDirection).toEqual({ x: 1, y: 0 });
  });

  it('should not reverse direction', () => {
    snake.changeDirection({ x: 1, y: 0 }); // moving right
    snake.update(); // Apply direction
    snake.changeDirection({ x: -1, y: 0 }); // try to move left
    expect(snake.nextDirection).toEqual({ x: 1, y: 0 }); // should still move right
  });

  it('should move the snake body correctly', () => {
    snake.changeDirection({ x: 1, y: 0 });
    snake.update();
    expect(snake.body[0]).toEqual({ x: 11, y: 10 });
    
    // Add a body part manually to test dragging
    snake.body.push({ x: 10, y: 10 });
    snake.update();
    expect(snake.body[0]).toEqual({ x: 12, y: 10 });
    expect(snake.body[1]).toEqual({ x: 11, y: 10 });
  });
});
