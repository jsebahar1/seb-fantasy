const NCAA_CUTOFFS = [3, 10, 25, 50];

export function rankBadgeClass(rank, cutoffs = NCAA_CUTOFFS) {
  const [darkGreen, lightGreen, gold, orange] = cutoffs;
  if (rank <= darkGreen) return 'pr-rank pr-rank--top3';
  if (rank <= lightGreen) return 'pr-rank pr-rank--top10';
  if (rank <= gold) return 'pr-rank pr-rank--top25';
  if (rank <= orange) return 'pr-rank pr-rank--top50';
  return 'pr-rank pr-rank--bottom';
}
