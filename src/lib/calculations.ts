import type { BankrollMovement, Bet } from "@/types";

export interface BankrollMetrics {
  activeBankroll: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBonus: number;
  totalAdjustments: number;
  settledProfit: number;
  pendingExposure: number;
  netRealProfit: number;
  ownCapitalAtRisk: number;
  realizedProfit: number;
  exposedProfit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  breakEven: number;
  observedEdge: number;
  currentDrawdown: number;
  maxDrawdown: number;
  currentStreak: number;
  currentStreakType: "win" | "loss" | "none";
  settledCount: number;
}

export function calculateBetProfit(status: Bet["status"], stake: number, odds: number) {
  if (status === "win") return stake * (odds - 1);
  if (status === "loss") return -stake;
  return 0;
}

export function calculateMetrics(bets: Bet[], movements: BankrollMovement[]): BankrollMetrics {
  const settled = bets.filter((bet) => bet.status === "win" || bet.status === "loss" || bet.status === "void");
  const decided = settled.filter((bet) => bet.status === "win" || bet.status === "loss");
  const wins = settled.filter((bet) => bet.status === "win");
  const totalDeposits = sumMovements(movements, "deposit");
  const totalWithdrawals = sumMovements(movements, "withdrawal");
  const totalBonus = sumMovements(movements, "bonus");
  const totalAdjustments = movements
    .filter((movement) => movement.type === "adjustment")
    .reduce((total, movement) => total + movement.amount, 0);
  const settledProfit = settled.reduce((total, bet) => total + bet.profit, 0);
  const pendingExposure = bets
    .filter((bet) => bet.status === "pending")
    .reduce((total, bet) => total + bet.stake, 0);
  const activeBankroll = totalDeposits + totalBonus + totalAdjustments - totalWithdrawals + settledProfit;
  const netRealProfit = activeBankroll + totalWithdrawals - totalDeposits;
  const ownCapitalAtRisk = Math.max(0, totalDeposits - totalWithdrawals);
  const realizedProfit = Math.max(0, totalWithdrawals - totalDeposits);
  const exposedProfit = Math.max(0, activeBankroll - ownCapitalAtRisk);
  const averageOdds = decided.length ? decided.reduce((total, bet) => total + bet.odds, 0) / decided.length : 0;
  const winRate = decided.length ? wins.length / decided.length : 0;
  const breakEven = averageOdds ? 1 / averageOdds : 0;
  const roi = totalDeposits ? netRealProfit / totalDeposits : 0;
  const { currentDrawdown, maxDrawdown } = calculateDrawdowns(activeBankroll, movements, settled);
  const streak = calculateStreak(decided);

  return {
    activeBankroll,
    totalDeposits,
    totalWithdrawals,
    totalBonus,
    totalAdjustments,
    settledProfit,
    pendingExposure,
    netRealProfit,
    ownCapitalAtRisk,
    realizedProfit,
    exposedProfit,
    roi,
    winRate,
    averageOdds,
    breakEven,
    observedEdge: winRate - breakEven,
    currentDrawdown,
    maxDrawdown,
    currentStreak: streak.count,
    currentStreakType: streak.type,
    settledCount: settled.length
  };
}

function sumMovements(movements: BankrollMovement[], type: BankrollMovement["type"]) {
  return movements.filter((movement) => movement.type === type).reduce((total, movement) => total + movement.amount, 0);
}

function calculateStreak(bets: Bet[]) {
  const ordered = [...bets].sort((a, b) => b.date.localeCompare(a.date));
  const latest = ordered[0]?.status;
  if (latest !== "win" && latest !== "loss") return { type: "none" as const, count: 0 };
  let count = 0;
  for (const bet of ordered) {
    if (bet.status !== latest) break;
    count += 1;
  }
  return { type: latest, count };
}

function calculateDrawdowns(activeBankroll: number, movements: BankrollMovement[], bets: Bet[]) {
  const startingCapital = movements
    .filter((movement) => movement.type !== "withdrawal")
    .reduce((total, movement) => total + movement.amount, 0);
  let bankroll = startingCapital;
  let peak = Math.max(1, bankroll);
  let maxDrawdown = 0;
  const ordered = [...bets].sort((a, b) => a.date.localeCompare(b.date));
  for (const bet of ordered) {
    bankroll += bet.profit;
    peak = Math.max(peak, bankroll);
    maxDrawdown = Math.max(maxDrawdown, peak ? (peak - bankroll) / peak : 0);
  }
  const currentDrawdown = peak ? Math.max(0, (peak - activeBankroll) / peak) : 0;
  return { currentDrawdown, maxDrawdown };
}

export interface StrategyMetrics {
  strategy: string;
  count: number;
  profit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  breakEven: number;
  edge: number;
  largestLosingStreak: number;
  status: "Insuficiente" | "Em observação" | "Mais consistente" | "Risco elevado" | "Negativa até agora";
}

export function calculateStrategyMetrics(bets: Bet[], minimumSample: number): StrategyMetrics[] {
  const groups = new Map<string, Bet[]>();
  for (const bet of bets.filter((item) => item.status !== "pending" && item.status !== "void")) {
    const strategy = bet.strategy || "Sem estratégia";
    groups.set(strategy, [...(groups.get(strategy) ?? []), bet]);
  }
  return [...groups.entries()].map(([strategy, items]) => {
    const profit = items.reduce((total, bet) => total + bet.profit, 0);
    const staked = items.reduce((total, bet) => total + bet.stake, 0);
    const wins = items.filter((bet) => bet.status === "win").length;
    const averageOdds = items.reduce((total, bet) => total + bet.odds, 0) / items.length;
    const winRate = wins / items.length;
    const edge = winRate - 1 / averageOdds;
    const largestLosingStreak = maxLosingStreak(items);
    let status: StrategyMetrics["status"] = "Em observação";
    if (items.length < Math.min(25, minimumSample)) status = "Insuficiente";
    else if (profit < 0) status = "Negativa até agora";
    else if (largestLosingStreak >= 5) status = "Risco elevado";
    else if (items.length >= minimumSample && edge > 0) status = "Mais consistente";
    return { strategy, count: items.length, profit, roi: staked ? profit / staked : 0, winRate, averageOdds, breakEven: 1 / averageOdds, edge, largestLosingStreak, status };
  });
}

function maxLosingStreak(items: Bet[]) {
  let current = 0;
  let maximum = 0;
  for (const bet of [...items].sort((a, b) => a.date.localeCompare(b.date))) {
    current = bet.status === "loss" ? current + 1 : 0;
    maximum = Math.max(maximum, current);
  }
  return maximum;
}

export function buildBankrollSeries(bets: Bet[], movements: BankrollMovement[]) {
  const events = [
    ...movements.map((item) => ({ date: item.date, value: item.type === "withdrawal" ? -item.amount : item.amount })),
    ...bets.filter((item) => item.status !== "pending").map((item) => ({ date: item.date, value: item.profit }))
  ].sort((a, b) => a.date.localeCompare(b.date));
  let total = 0;
  return events.map((event) => {
    total += event.value;
    return { date: event.date, bankroll: Math.round(total * 100) / 100 };
  });
}
