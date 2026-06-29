export function saveScore(playerName, score) {
  const leaderboardKey = 'agro_leaderboard';
  let leaderboard = getLeaderboard();
  
  leaderboard.push({ name: playerName, score: score });
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Keep only Top 5
  if (leaderboard.length > 5) {
    leaderboard = leaderboard.slice(0, 5);
  }
  
  try {
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
  } catch (e) {
    console.warn("localStorage not available");
  }
}

export function getLeaderboard() {
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
