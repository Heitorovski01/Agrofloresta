import { describe, it, expect, beforeEach } from 'vitest';
import { getTop3, checkIfTop3, saveToLeaderboard } from '../jogos/jogo1/assets/js/score.js';

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
    expect(getTop3()).toEqual([]);
  });

  it('should save and retrieve a score', () => {
    saveToLeaderboard('AAA', 10);
    const leaderboard = getTop3();
    expect(leaderboard.length).toBe(1);
    expect(leaderboard[0]).toEqual({ name: 'AAA', score: 10 });
  });

  it('should keep scores sorted descending', () => {
    saveToLeaderboard('AAA', 10);
    saveToLeaderboard('BBB', 30);
    saveToLeaderboard('CCC', 20);
    const leaderboard = getTop3();
    expect(leaderboard[0]).toEqual({ name: 'BBB', score: 30 });
    expect(leaderboard[1]).toEqual({ name: 'CCC', score: 20 });
    expect(leaderboard[2]).toEqual({ name: 'AAA', score: 10 });
  });

  it('should keep only top 3 scores', () => {
    saveToLeaderboard('AA1', 10);
    saveToLeaderboard('AA2', 20);
    saveToLeaderboard('AA3', 30);
    saveToLeaderboard('AA4', 40); // Should push out AA1
    
    const leaderboard = getTop3();
    expect(leaderboard.length).toBe(3);
    expect(leaderboard[0]).toEqual({ name: 'AA4', score: 40 });
    expect(leaderboard[2]).toEqual({ name: 'AA2', score: 20 });
  });

  it('should correctly evaluate checkIfTop3', () => {
    expect(checkIfTop3(10)).toBe(true); // Empty list
    
    saveToLeaderboard('AA1', 10);
    saveToLeaderboard('AA2', 20);
    saveToLeaderboard('AA3', 30);
    
    expect(checkIfTop3(5)).toBe(false); // Lower than the 3rd (10)
    expect(checkIfTop3(15)).toBe(true); // Higher than the 3rd (10)
  });
});
