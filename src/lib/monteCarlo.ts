import type { SimulationSettings } from "@/types";

export interface MonteCarloResult {
  probabilityOfTarget: number;
  probabilityOfRuin: number;
  averageFinalBankroll: number;
  medianFinalBankroll: number;
  p10FinalBankroll: number;
  p90FinalBankroll: number;
  averageMaxDrawdown: number;
  averageBetsToTarget: number;
  distribution: { range: string; count: number }[];
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
    const end = index === 7 ? maximum + 1 : start + step;
    return { range: `${Math.round(start)}`, count: values.filter((value) => value >= start && value < end).length };
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
