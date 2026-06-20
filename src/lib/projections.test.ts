import { describe, expect, it } from "vitest";
import { buildProjection } from "@/lib/projections";

describe("buildProjection", () => {
  it("ordena cenários por velocidade e mantém a meta", () => {
    const [conservative, base, aggressive] = buildProjection({ initialBankroll: 1000, targetBankroll: 2000, expectedReturnPerCycle: 0.02, cyclesPerWeek: 5, startDate: "2026-01-01" });
    expect(conservative.cycles).toBeGreaterThan(base.cycles);
    expect(base.cycles).toBeGreaterThan(aggressive.cycles);
    expect(base.series.at(-1)?.bankroll).toBeGreaterThanOrEqual(2000);
    expect(base.estimatedDate).toBeTruthy();
  });
});
