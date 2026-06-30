import { describe, it, expect, vi, afterEach } from 'vitest';
import { Food } from '../jogos/jogo1/assets/js/food.js';

describe('Food Logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with coordinates within grid boundaries', () => {
    // Mock random to return predictable values
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const food = new Food(15, 17);
    expect(food.position.x).toBe(7);  // Math.floor(0.5 * 15)
    expect(food.position.y).toBe(8);  // Math.floor(0.5 * 17)
    expect(food.type).toBe('pequi'); // types = ['buriti', 'pequi', 'jatoba']. 0.5 * 3 = 1.5 -> floor(1.5) = 1 (pequi)
  });

  it('should spawn at new coordinates not occupied by the snake', () => {
    // We want the first random call to land on the snake, then the second one to miss
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      if (callCount <= 2) return 0.25; // 0.25 * 15 = 3, 0.25 * 17 = 4 (lands on 3,4)
      return 0.1; // 0.1 * 15 = 1, 0.1 * 17 = 1 (lands on 1,1)
    });

    const food = new Food(15, 17); // Initializes and calls spawn (uses 2 Math.random calls + 1 for type)
    
    // Now call spawn with snake covering 3,4
    callCount = 0; // reset for explicit spawn call
    const snakeBody = [{ x: 3, y: 4 }, { x: 3, y: 5 }];
    food.spawn(snakeBody);
    
    expect(food.position.x).toBe(1);
    expect(food.position.y).toBe(1);
  });
});
