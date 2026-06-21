import { describe, expect, it } from "vitest";
import { normalizeBackupPayload, validateBackup } from "@/lib/backup";

describe("validateBackup", () => {
  it("aceita somente o schema e origem esperados", () => {
    const valid = { schemaVersion: 1, exportedAt: "2026-01-01", appVersion: "0.1.0", bets: [], bankrollMovements: [], rules: [], settings: [], alertPreferences: [], simulationSettings: [], monthlyReports: [], metadata: { source: "bankroll-lab", recordCount: 0 } };
    expect(validateBackup(valid)).toBe(true);
    expect(validateBackup({ ...valid, schemaVersion: 2 })).toBe(false);
    expect(validateBackup({ ...valid, metadata: { source: "other", recordCount: 0 } })).toBe(false);
  });

  it("aceita e normaliza o status legado open como pending", () => {
    const legacy = {
      schemaVersion: 1,
      exportedAt: "2026-01-01",
      appVersion: "0.1.0",
      bets: [{ id: "open-1", status: "open", stake: 25, profit: 0, returnAmount: 0 }],
      bankrollMovements: [],
      rules: [],
      settings: [],
      alertPreferences: [],
      simulationSettings: [],
      monthlyReports: [],
      metadata: { source: "bankroll-lab", recordCount: 1 }
    };
    expect(validateBackup(legacy)).toBe(true);
    expect(normalizeBackupPayload(legacy as never).bets[0].status).toBe("pending");
  });
});
