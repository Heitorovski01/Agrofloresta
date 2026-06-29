export function getTop3() {
  const leaderboardKey = 'agro_leaderboard';
  try {
    const saved = localStorage.getItem(leaderboardKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("localStorage not available");
  }
  return [];
}

export function checkIfTop3(score) {
  if (score <= 0) return false;
  const top3 = getTop3();
  if (top3.length < 3) return true;
  return score > top3[top3.length - 1].score;
}

export function saveToLeaderboard(name, score) {
  const leaderboardKey = 'agro_leaderboard';
  let top3 = getTop3();
  
  top3.push({ name: name, score: score });
  top3.sort((a, b) => b.score - a.score);
  
  // Keep only Top 3
  if (top3.length > 3) {
    top3 = top3.slice(0, 3);
  }
  
  try {
    localStorage.setItem(leaderboardKey, JSON.stringify(top3));
  } catch (e) {
    console.warn("localStorage not available");
  }
}
