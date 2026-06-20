import type { BankrollMetrics } from "@/lib/calculations";
import type { RiskAlert, Rules, Settings } from "@/types";

export function generateAlerts(metrics: BankrollMetrics, rules: Rules, settings: Settings, betsSinceBackup: number): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  if (metrics.currentDrawdown >= 0.2) alerts.push(alert("drawdown-20", "high", "Drawdown acima de 20%", "A banca está muito abaixo do pico. Pausa recomendada.", "loss"));
  else if (metrics.currentDrawdown >= 0.1) alerts.push(alert("drawdown-10", "high", "Drawdown elevado", "Sua banca caiu mais de 10% desde o pico.", "loss"));
  if (metrics.currentStreakType === "loss" && metrics.currentStreak >= rules.pauseAfterLosses) alerts.push(alert("loss-streak", "high", `${metrics.currentStreak} perdas consecutivas`, "A regra de pausa foi atingida. Não tente recuperar a perda.", "discipline"));
  if (metrics.settledCount < 50) alerts.push(alert("small-sample", "medium", "Amostra menor que 50 apostas", "Não trate o resultado atual como método validado.", "statistical"));
  else if (metrics.settledCount < 100) alerts.push(alert("sample-observation", "low", "Amostra em observação", "Ainda há pouca evidência para extrapolar o edge observado.", "statistical"));
  if (metrics.observedEdge < 0 && metrics.settledCount >= 20) alerts.push(alert("negative-edge", "high", "Edge observado negativo", "O win rate está abaixo do break-even médio.", "statistical"));
  if (!settings.lastExportedAt) alerts.push(alert("no-backup", "medium", "Você ainda não exportou um backup", "Seu histórico é parte da análise. Guarde uma cópia externa.", "backup"));
  else if (Date.now() - new Date(settings.lastExportedAt).getTime() > 7 * 86_400_000) alerts.push(alert("backup-late", "medium", "Backup atrasado", "O último arquivo exportado tem mais de 7 dias.", "backup"));
  if (betsSinceBackup > 20) alerts.push(alert("backup-bets", "medium", "Mais de 20 apostas sem backup", "Exporte uma cópia para proteger sua base estatística.", "backup"));
  if (metrics.activeBankroll >= rules.partialWithdrawalTarget && metrics.netRealProfit > 0) alerts.push(alert("partial-target", "low", "Meta parcial atingida", "Considere retirar parte do lucro conforme sua regra.", "gain"));
  return alerts;
}

function alert(id: string, severity: RiskAlert["severity"], title: string, description: string, category: RiskAlert["category"]): RiskAlert {
  return { id, severity, title, description, category };
}
