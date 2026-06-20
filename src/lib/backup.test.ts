import { describe, expect, it } from "vitest";
import { validateBackup } from "@/lib/backup";

describe("validateBackup", () => {
  it("aceita somente o schema e origem esperados", () => {
    const valid = { schemaVersion: 1, exportedAt: "2026-01-01", appVersion: "0.1.0", bets: [], bankrollMovements: [], rules: [], settings: [], alertPreferences: [], simulationSettings: [], monthlyReports: [], metadata: { source: "bankroll-lab", recordCount: 0 } };
    expect(validateBackup(valid)).toBe(true);
    expect(validateBackup({ ...valid, schemaVersion: 2 })).toBe(false);
    expect(validateBackup({ ...valid, metadata: { source: "other", recordCount: 0 } })).toBe(false);
  });
});
