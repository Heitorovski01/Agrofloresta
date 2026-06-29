import { describe, it, expect, vi, afterEach } from 'vitest';
import { Food } from '../jogos/jogo1/assets/js/food.js';

describe('Food Logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with coordinates within grid boundaries', () => {
    // Mock random to return predictable values (e.g., 0.5 -> 10)
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const food = new Food(20);
    expect(food.position.x).toBe(10);
    expect(food.position.y).toBe(10);
    expect(food.type).toBe('pequi'); // types = ['buriti', 'pequi', 'jatoba']. 0.5 * 3 = 1.5 -> floor(1.5) = 1 (pequi)
  });

  it('should spawn at new coordinates not occupied by the snake', () => {
    // We want the first random call to land on the snake, then the second one to miss
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      if (callCount <= 2) return 0.25; // 0.25 * 20 = 5 (lands on 5,5)
      return 0.1; // 0.1 * 20 = 2 (lands on 2,2)
    });

    const food = new Food(20); // Initializes and calls spawn (uses 2 Math.random calls + 1 for type)
    
    // Now call spawn with snake covering 5,5
    callCount = 0; // reset for explicit spawn call
    const snakeBody = [{ x: 5, y: 5 }, { x: 5, y: 6 }];
    food.spawn(snakeBody);
    
    expect(food.position.x).toBe(2);
    expect(food.position.y).toBe(2);
  });
});
