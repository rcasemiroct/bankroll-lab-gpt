import type { Bet, SimulationSettings } from "@/types";

export type HistoryWindow = 30 | 90 | "all";

export interface HistoryCalibration {
  count: number;
  firstDate: string;
  lastDate: string;
  averageOdds: number;
  winProbability: number;
  averageStake: number;
  maximumStake: number;
  stakePercentage: number;
}

export function calibrateFromHistory(bets: Bet[], activeBankroll: number, window: HistoryWindow): HistoryCalibration | null {
  const decided = bets.filter((bet) => bet.status === "win" || bet.status === "loss");
  if (!decided.length) return null;
  const lastDate = decided.reduce((latest, bet) => bet.date > latest ? bet.date : latest, decided[0].date);
  const cutoff = window === "all" ? "" : new Date(new Date(`${lastDate}T12:00:00`).getTime() - (window - 1) * 86_400_000).toISOString().slice(0, 10);
  const sample = decided.filter((bet) => !cutoff || bet.date >= cutoff);
  if (!sample.length) return null;
  const totalStake = sample.reduce((total, bet) => total + bet.stake, 0);
  const averageStake = totalStake / sample.length;
  return {
    count: sample.length,
    firstDate: sample.reduce((earliest, bet) => bet.date < earliest ? bet.date : earliest, sample[0].date),
    lastDate,
    averageOdds: sample.reduce((total, bet) => total + bet.odds, 0) / sample.length,
    winProbability: sample.filter((bet) => bet.status === "win").length / sample.length,
    averageStake,
    maximumStake: sample.reduce((maximum, bet) => Math.max(maximum, bet.stake), 0),
    stakePercentage: activeBankroll > 0 ? averageStake / activeBankroll : 0
  };
}

export interface MonteCarloResult {
  probabilityOfTarget: number;
  probabilityOfRuin: number;
  averageFinalBankroll: number;
  medianFinalBankroll: number;
  p10FinalBankroll: number;
  p90FinalBankroll: number;
  averageMaxDrawdown: number;
  averageBetsToTarget: number;
  distribution: { range: string; start: number; end: number; count: number }[];
  paths: { bet: number; [path: string]: number }[];
}

export function runMonteCarlo(settings: SimulationSettings, random = Math.random): MonteCarloResult {
  const finals: number[] = [];
  const drawdowns: number[] = [];
  const betsToTarget: number[] = [];
  const samplePaths: number[][] = [];
  let targets = 0;
  let ruins = 0;

  for (let simulation = 0; simulation < settings.numberOfSimulations; simulation += 1) {
    let bankroll = settings.initialBankroll;
    let peak = bankroll;
    let maximumDrawdown = 0;
    const path = [bankroll];
    for (let bet = 1; bet <= settings.numberOfBets; bet += 1) {
      const plannedStake = settings.stakeMode === "fixed" ? settings.fixedStake : bankroll * settings.stakePercentage;
      const stake = Math.max(0, Math.min(plannedStake, settings.maxStake, bankroll));
      bankroll += random() < settings.winProbability ? stake * (settings.averageOdds - 1) : -stake;
      peak = Math.max(peak, bankroll);
      maximumDrawdown = Math.max(maximumDrawdown, peak ? (peak - bankroll) / peak : 0);
      if (simulation < 8) path.push(Math.round(bankroll * 100) / 100);
      if (bankroll >= settings.targetBankroll) {
        targets += 1;
        betsToTarget.push(bet);
        break;
      }
      if (bankroll <= settings.stopBankroll) {
        ruins += 1;
        break;
      }
    }
    finals.push(bankroll);
    drawdowns.push(maximumDrawdown);
    if (simulation < 8) samplePaths.push(path);
  }

  const sorted = [...finals].sort((a, b) => a - b);
  return {
    probabilityOfTarget: targets / settings.numberOfSimulations,
    probabilityOfRuin: ruins / settings.numberOfSimulations,
    averageFinalBankroll: average(finals),
    medianFinalBankroll: percentile(sorted, 0.5),
    p10FinalBankroll: percentile(sorted, 0.1),
    p90FinalBankroll: percentile(sorted, 0.9),
    averageMaxDrawdown: average(drawdowns),
    averageBetsToTarget: betsToTarget.length ? average(betsToTarget) : 0,
    distribution: distribution(finals),
    paths: normalizePaths(samplePaths)
  };
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function percentile(sorted: number[], value: number) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * value))];
}

function distribution(values: number[]) {
  if (!values.length) return [];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const step = Math.max(1, (maximum - minimum) / 8);
  return Array.from({ length: 8 }, (_, index) => {
    const start = minimum + index * step;
    const end = start + step;
    return {
      range: `${Math.round(start)}–${Math.round(end)}`,
      start,
      end,
      count: values.filter((value) => value >= start && (index === 7 ? value <= end : value < end)).length
    };
  });
}

function normalizePaths(paths: number[][]) {
  const maximumLength = Math.max(0, ...paths.map((path) => path.length));
  return Array.from({ length: maximumLength }, (_, bet) => {
    const point: { bet: number; [path: string]: number } = { bet };
    paths.forEach((path, index) => {
      point[`path${index}`] = path[Math.min(bet, path.length - 1)];
    });
    return point;
  });
}
