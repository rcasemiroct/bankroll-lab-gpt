import { describe, expect, it } from "vitest";
import { calibrateFromHistory, runMonteCarlo } from "@/lib/monteCarlo";
import type { Bet, SimulationSettings } from "@/types";

const settings: SimulationSettings = { id: "default", initialBankroll: 100, targetBankroll: 120, stopBankroll: 20, averageOdds: 2, winProbability: 0.5, stakeMode: "fixed", fixedStake: 10, stakePercentage: 0.02, maxStake: 10, numberOfBets: 10, numberOfSimulations: 100 };

describe("runMonteCarlo", () => {
  it("encerra todos os caminhos na meta quando o gerador sempre vence", () => {
    const result = runMonteCarlo(settings, () => 0);
    expect(result.probabilityOfTarget).toBe(1);
    expect(result.probabilityOfRuin).toBe(0);
    expect(result.averageBetsToTarget).toBe(2);
    expect(result.medianFinalBankroll).toBe(120);
    expect(result.distribution.reduce((total, bucket) => total + bucket.count, 0)).toBe(100);
    expect(result.distribution.every((bucket) => bucket.end > bucket.start)).toBe(true);
  });
  it("encerra todos os caminhos no stop quando o gerador sempre perde", () => {
    const result = runMonteCarlo({ ...settings, numberOfBets: 20 }, () => 1);
    expect(result.probabilityOfRuin).toBe(1);
    expect(result.probabilityOfTarget).toBe(0);
  });
});

describe("calibrateFromHistory", () => {
  const historicalBet = (date: string, status: Bet["status"], stake: number, odds: number): Bet => ({
    id: `${date}-${status}-${stake}`,
    date,
    sportsbook: "Casa",
    event: "Evento",
    market: "Mercado",
    strategy: "Estratégia",
    odds,
    stake,
    status,
    returnAmount: 0,
    profit: status === "win" ? stake * (odds - 1) : status === "loss" ? -stake : 0,
    notes: "",
    createdAt: date,
    updatedAt: date
  });

  it("calibra apenas apostas encerradas dentro da janela", () => {
    const result = calibrateFromHistory([
      historicalBet("2026-01-01", "win", 100, 2),
      historicalBet("2026-03-01", "win", 20, 1.8),
      historicalBet("2026-03-15", "loss", 40, 2.2),
      historicalBet("2026-03-20", "pending", 50, 3)
    ], 300, 30);
    expect(result?.count).toBe(2);
    expect(result?.averageOdds).toBe(2);
    expect(result?.winProbability).toBe(0.5);
    expect(result?.averageStake).toBe(30);
    expect(result?.maximumStake).toBe(40);
    expect(result?.stakePercentage).toBe(0.1);
  });
});
