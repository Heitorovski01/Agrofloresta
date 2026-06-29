import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveScore, getLeaderboard } from '../jogos/jogo1/assets/js/score.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('score.js', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should return an empty array if there is no leaderboard', () => {
    expect(getLeaderboard()).toEqual([]);
  });

  it('should save and retrieve a score', () => {
    saveScore('AAA', 10);
    const leaderboard = getLeaderboard();
    expect(leaderboard.length).toBe(1);
    expect(leaderboard[0]).toEqual({ name: 'AAA', score: 10 });
  });

  it('should keep scores sorted descending', () => {
    saveScore('AAA', 10);
    saveScore('BBB', 30);
    saveScore('CCC', 20);
    const leaderboard = getLeaderboard();
    expect(leaderboard[0]).toEqual({ name: 'BBB', score: 30 });
    expect(leaderboard[1]).toEqual({ name: 'CCC', score: 20 });
    expect(leaderboard[2]).toEqual({ name: 'AAA', score: 10 });
  });

  it('should keep only top 5 scores', () => {
    saveScore('AA1', 10);
    saveScore('AA2', 20);
    saveScore('AA3', 30);
    saveScore('AA4', 40);
    saveScore('AA5', 50);
    saveScore('AA6', 60); // Should push out AA1
    
    const leaderboard = getLeaderboard();
    expect(leaderboard.length).toBe(5);
    expect(leaderboard[0]).toEqual({ name: 'AA6', score: 60 });
    expect(leaderboard[4]).toEqual({ name: 'AA2', score: 20 });
  });
});
