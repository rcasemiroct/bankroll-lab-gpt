import Dexie, { type EntityTable } from "dexie";
import type { AlertPreference, BankrollMovement, Bet, MonthlyReport, Rules, Settings, SimulationSettings, Snapshot } from "@/types";
import { calculateBetProfit } from "@/lib/calculations";

class BankrollDatabase extends Dexie {
  bets!: EntityTable<Bet, "id">;
  movements!: EntityTable<BankrollMovement, "id">;
  rules!: EntityTable<Rules, "id">;
  settings!: EntityTable<Settings, "id">;
  alertPreferences!: EntityTable<AlertPreference, "id">;
  simulationSettings!: EntityTable<SimulationSettings, "id">;
  snapshots!: EntityTable<Snapshot, "id">;
  monthlyReports!: EntityTable<MonthlyReport, "id">;

  constructor() {
    super("BankrollLab");
    this.version(1).stores({
      bets: "id, date, sportsbook, strategy, status, createdAt",
      movements: "id, date, type, createdAt",
      rules: "id",
      settings: "id",
      alertPreferences: "id",
      simulationSettings: "id",
      snapshots: "id, createdAt, reason",
      monthlyReports: "id, month"
    });
  }
}

export const db = new BankrollDatabase();

export const defaultRules: Rules = {
  id: "default",
  maxStakePercentage: 0.02,
  strongAlertPercentage: 0.05,
  dailyStopPercentage: 0.05,
  weeklyStopPercentage: 0.15,
  partialWithdrawalTarget: 2200,
  finalTarget: 5000,
  pauseAfterLosses: 3,
  pauseAfterStop: true,
  minimumStrategyBets: 100,
  withdrawalPercentage: 0.3
};

export const defaultSettings: Settings = {
  id: "default",
  onboardingComplete: false,
  alertProfile: "conservative",
  initialBankroll: 1100,
  startDate: "2026-05-09",
  betsAtLastExport: 0,
  theme: "dark",
  updatedAt: new Date().toISOString()
};

export const defaultSimulationSettings: SimulationSettings = {
  id: "default",
  initialBankroll: 1432.8,
  targetBankroll: 5000,
  stopBankroll: 500,
  averageOdds: 1.92,
  winProbability: 0.56,
  stakeMode: "percentage",
  fixedStake: 30,
  stakePercentage: 0.02,
  maxStake: 100,
  numberOfBets: 250,
  numberOfSimulations: 2000
};

const samples: Array<[string, Bet["status"], number, number, string]> = [
  ["2026-05-09", "loss", 40, 1.9, "Mercado principal"],
  ["2026-05-10", "loss", 35, 1.82, "Mercado principal"],
  ["2026-05-11", "win", 70, 2.1, "Valor controlado"],
  ["2026-05-12", "win", 80, 1.95, "Valor controlado"],
  ["2026-05-13", "win", 90, 2.0, "Mercado principal"],
  ["2026-05-13", "loss", 32, 1.88, "Linha conservadora"],
  ["2026-05-14", "win", 75, 1.86, "Linha conservadora"],
  ["2026-05-14", "win", 68, 2.12, "Valor controlado"],
  ["2026-05-15", "win", 60, 1.92, "Mercado principal"],
  ["2026-05-15", "loss", 51.26, 1.78, "Linha conservadora"],
  ["2026-05-16", "win", 58, 1.9, "Mercado principal"],
  ["2026-05-16", "pending", 28.66, 1.84, "Valor controlado"]
];

export async function initializeDatabase() {
  await db.transaction("rw", [db.rules, db.settings, db.simulationSettings], async () => {
    if (!(await db.rules.get("default"))) await db.rules.add(defaultRules);
    if (!(await db.settings.get("default"))) await db.settings.add(defaultSettings);
    if (!(await db.simulationSettings.get("default"))) await db.simulationSettings.add(defaultSimulationSettings);
  });
}

export async function seedExampleData() {
  const now = new Date().toISOString();
  await db.transaction("rw", [db.bets, db.movements, db.settings], async () => {
    await db.bets.clear();
    await db.movements.clear();
    await db.movements.add({ id: crypto.randomUUID(), date: "2026-05-09", type: "deposit", amount: 1100, notes: "Depósito inicial de exemplo", createdAt: now });
    await db.bets.bulkAdd(samples.map(([date, status, stake, odds, strategy], index) => ({
      id: crypto.randomUUID(),
      date,
      sportsbook: index % 2 ? "Casa B" : "Casa A",
      event: `Evento de exemplo ${index + 1}`,
      market: index % 3 ? "Mercado principal" : "Linha alternativa",
      strategy,
      odds,
      stake,
      status,
      returnAmount: status === "win" ? stake * odds : status === "void" ? stake : 0,
      profit: calculateBetProfit(status, stake, odds),
      notes: "Dado demonstrativo. Pode ser apagado.",
      createdAt: now,
      updatedAt: now
    })));
    await db.settings.update("default", { onboardingComplete: true, updatedAt: now });
  });
}

export async function startClean(initialBankroll: number, finalTarget: number, maxStake: number, dailyStop: number, alertProfile: Settings["alertProfile"]) {
  const now = new Date().toISOString();
  await db.transaction("rw", [db.bets, db.movements, db.rules, db.settings], async () => {
    await db.bets.clear();
    await db.movements.clear();
    if (initialBankroll > 0) await db.movements.add({ id: crypto.randomUUID(), date: now.slice(0, 10), type: "deposit", amount: initialBankroll, notes: "Banca inicial", createdAt: now });
    await db.rules.update("default", { finalTarget, maxStakePercentage: maxStake, dailyStopPercentage: dailyStop });
    await db.settings.update("default", { onboardingComplete: true, alertProfile, initialBankroll, startDate: now.slice(0, 10), updatedAt: now });
  });
}
