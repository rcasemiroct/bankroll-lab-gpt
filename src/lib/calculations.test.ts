import { describe, expect, it } from "vitest";
import { calculateBetProfit, calculateMetrics } from "@/lib/calculations";
import type { BankrollMovement, Bet } from "@/types";

const bet = (status: Bet["status"], stake: number, odds: number, date: string): Bet => ({ id: crypto.randomUUID(), date, sportsbook: "Casa", event: "Evento", market: "Mercado", strategy: "Teste", odds, stake, status, returnAmount: 0, profit: calculateBetProfit(status, stake, odds), notes: "", createdAt: date, updatedAt: date });
const movement = (type: BankrollMovement["type"], amount: number): BankrollMovement => ({ id: crypto.randomUUID(), date: "2026-01-01", type, amount, notes: "", createdAt: "2026-01-01" });

describe("calculateBetProfit", () => {
  it("aplica as quatro regras de resultado", () => {
    expect(calculateBetProfit("win", 100, 2.1)).toBeCloseTo(110);
    expect(calculateBetProfit("loss", 100, 2.1)).toBe(-100);
    expect(calculateBetProfit("void", 100, 2.1)).toBe(0);
    expect(calculateBetProfit("pending", 100, 2.1)).toBe(0);
  });
});

describe("calculateMetrics", () => {
  it("calcula banca ativa e lucro líquido real pela fórmula central", () => {
    const metrics = calculateMetrics([bet("win", 100, 2, "2026-01-02"), bet("loss", 50, 2, "2026-01-03")], [movement("deposit", 1000), movement("withdrawal", 200), movement("bonus", 20)]);
    expect(metrics.activeBankroll).toBe(870);
    expect(metrics.netRealProfit).toBe(70);
    expect(metrics.ownCapitalAtRisk).toBe(800);
    expect(metrics.winRate).toBe(0.5);
    expect(metrics.breakEven).toBe(0.5);
  });
});
