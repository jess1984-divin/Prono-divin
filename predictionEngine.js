function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function predictFootball(home, away) {
  const weights = {
    form: 0.25,
    attack: 0.20,
    defense: 0.20,
    ranking: 0.20,
    h2h: 0.10,
    homeAdvantage: 0.05
  };

  const homeScore =
    home.form * weights.form +
    home.attack * weights.attack +
    home.defense * weights.defense +
    home.ranking * weights.ranking +
    home.h2h * weights.h2h +
    100 * weights.homeAdvantage;

  const awayScore =
    away.form * weights.form +
    away.attack * weights.attack +
    away.defense * weights.defense +
    away.ranking * weights.ranking +
    away.h2h * weights.h2h;

  const difference = homeScore - awayScore;
  let draw = clamp(28 - Math.abs(difference) * 0.25, 12, 30);
  const remaining = 100 - draw;
  const total = homeScore + awayScore || 1;

  let homeProbability = Math.round(remaining * homeScore / total);
  draw = Math.round(draw);
  const awayProbability = 100 - homeProbability - draw;

  return {
    home: homeProbability,
    draw,
    away: awayProbability,
    confidence: Math.max(homeProbability, draw, awayProbability)
  };
}

export function predictTennis(player1, player2) {
  const rankingScore = (ranking) =>
    clamp(100 - Math.log10(Math.max(ranking, 1)) * 30, 0, 100);

  const score1 =
    rankingScore(player1.ranking) * 0.30 +
    player1.form * 0.30 +
    player1.surface * 0.25 +
    player1.h2h * 0.15;

  const score2 =
    rankingScore(player2.ranking) * 0.30 +
    player2.form * 0.30 +
    player2.surface * 0.25 +
    player2.h2h * 0.15;

  const total = score1 + score2 || 1;
  const probability1 = Math.round((score1 / total) * 100);
  const probability2 = 100 - probability1;

  return {
    player1: probability1,
    player2: probability2,
    confidence: Math.max(probability1, probability2)
  };
}