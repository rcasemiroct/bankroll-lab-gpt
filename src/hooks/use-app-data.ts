import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaultRules, defaultSettings, defaultSimulationSettings, initializeDatabase } from "@/db";
import { calculateMetrics } from "@/lib/calculations";
import { generateAlerts } from "@/lib/alerts";

export function useAppData() {
  useEffect(() => { void initializeDatabase(); }, []);
  const bets = useLiveQuery(() => db.bets.orderBy("date").reverse().toArray(), [], []);
  const movements = useLiveQuery(() => db.movements.orderBy("date").reverse().toArray(), [], []);
  const rules = useLiveQuery(() => db.rules.get("default"), [], defaultRules);
  const settings = useLiveQuery(() => db.settings.get("default"), [], defaultSettings);
  const simulationSettings = useLiveQuery(() => db.simulationSettings.get("default"), [], defaultSimulationSettings);
  const snapshots = useLiveQuery(() => db.snapshots.orderBy("createdAt").reverse().toArray(), [], []);
  const monthlyReports = useLiveQuery(() => db.monthlyReports.toArray(), [], []);
  const metrics = calculateMetrics(bets, movements);
  const alerts = generateAlerts(metrics, rules ?? defaultRules, settings ?? defaultSettings, Math.max(0, bets.length - (settings?.betsAtLastExport ?? 0)), bets);
  return { bets, movements, rules: rules ?? defaultRules, settings: settings ?? defaultSettings, simulationSettings: simulationSettings ?? defaultSimulationSettings, snapshots, monthlyReports, metrics, alerts };
}
