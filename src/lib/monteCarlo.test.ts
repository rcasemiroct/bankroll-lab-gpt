import { describe, expect, it } from "vitest";
import { runMonteCarlo } from "@/lib/monteCarlo";
import type { SimulationSettings } from "@/types";

const settings: SimulationSettings = { id: "default", initialBankroll: 100, targetBankroll: 120, stopBankroll: 20, averageOdds: 2, winProbability: 0.5, stakeMode: "fixed", fixedStake: 10, stakePercentage: 0.02, maxStake: 10, numberOfBets: 10, numberOfSimulations: 100 };

describe("runMonteCarlo", () => {
  it("encerra todos os caminhos na meta quando o gerador sempre vence", () => {
    const result = runMonteCarlo(settings, () => 0);
    expect(result.probabilityOfTarget).toBe(1);
    expect(result.probabilityOfRuin).toBe(0);
    expect(result.averageBetsToTarget).toBe(2);
    expect(result.medianFinalBankroll).toBe(120);
  });
  it("encerra todos os caminhos no stop quando o gerador sempre perde", () => {
    const result = runMonteCarlo({ ...settings, numberOfBets: 20 }, () => 1);
    expect(result.probabilityOfRuin).toBe(1);
    expect(result.probabilityOfTarget).toBe(0);
  });
});
