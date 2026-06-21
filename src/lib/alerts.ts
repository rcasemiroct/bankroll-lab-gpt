import type { BankrollMetrics } from "@/lib/calculations";
import type { Bet, RiskAlert, Rules, Settings } from "@/types";

export function generateAlerts(metrics: BankrollMetrics, rules: Rules, settings: Settings, betsSinceBackup: number, bets: Bet[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  if (metrics.currentDrawdown >= 0.2) alerts.push(alert("drawdown-20", "high", "Drawdown acima de 20%", "A banca está muito abaixo do pico. Pausa recomendada.", "loss"));
  else if (metrics.currentDrawdown >= 0.1) alerts.push(alert("drawdown-10", "high", "Drawdown elevado", "Sua banca caiu mais de 10% desde o pico.", "loss"));
  if (metrics.currentStreakType === "loss" && metrics.currentStreak >= rules.pauseAfterLosses) alerts.push(alert("loss-streak", "high", `${metrics.currentStreak} perdas consecutivas`, "A regra de pausa foi atingida. Não tente recuperar a perda.", "discipline"));
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const dailyResult = bets.filter((bet) => bet.date === today && bet.status !== "pending").reduce((total, bet) => total + bet.profit, 0);
  const weeklyResult = bets.filter((bet) => new Date(`${bet.date}T12:00:00`).getTime() >= weekAgo && bet.status !== "pending").reduce((total, bet) => total + bet.profit, 0);
  if (dailyResult < -metrics.activeBankroll * rules.dailyStopPercentage) alerts.push(alert("daily-stop", "high", "Stop diário atingido", "Sua perda diária passou do limite definido. Pausa recomendada.", "loss"));
  if (weeklyResult < -metrics.activeBankroll * rules.weeklyStopPercentage) alerts.push(alert("weekly-stop", "high", "Stop semanal atingido", "Sua perda semanal passou do limite definido.", "loss"));
  const latestPending = [...bets].filter((bet) => bet.status === "pending").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const pendingPercentage = latestPending && metrics.activeBankroll > 0 ? latestPending.stake / metrics.activeBankroll : 0;
  if (pendingPercentage > rules.strongAlertPercentage) alerts.push(alert("stake-strong", "high", "Valor apostado acima do alerta forte", "A exposição pendente ultrapassa o limite forte definido.", "discipline"));
  else if (pendingPercentage > rules.maxStakePercentage) alerts.push(alert("stake-limit", "medium", "Valor apostado acima do limite", "A exposição pendente ultrapassa sua regra de valor máximo por aposta.", "discipline"));
  const latestSettled = [...bets].filter((bet) => bet.status === "win" || bet.status === "loss").sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
  if (latestPending && latestSettled?.status === "loss" && latestPending.stake > latestSettled.stake) alerts.push(alert("stake-after-loss", "high", "Valor aumentado após perda", "Revise o registro: aumentar o valor apostado para recuperar perda viola sua regra.", "discipline"));
  if (metrics.settledCount < 50) alerts.push(alert("small-sample", "medium", "Amostra menor que 50 apostas", "Não trate o resultado atual como método validado.", "statistical"));
  else if (metrics.settledCount < 100) alerts.push(alert("sample-observation", "low", "Amostra em observação", "Ainda há pouca evidência para extrapolar o edge observado.", "statistical"));
  if (metrics.observedEdge < 0 && metrics.settledCount >= 20) alerts.push(alert("negative-edge", "high", "Edge observado negativo", "O win rate está abaixo do break-even médio.", "statistical"));
  if (metrics.breakEven > 0.6 && metrics.settledCount >= 20) alerts.push(alert("high-break-even", "medium", "Odd média exige acerto elevado", "A taxa de break-even observada é superior a 60%.", "statistical"));
  const positiveProfits = bets.filter((bet) => bet.profit > 0).map((bet) => bet.profit).sort((a, b) => b - a);
  const positiveTotal = positiveProfits.reduce((total, value) => total + value, 0);
  if (metrics.settledCount >= 20 && positiveTotal > 0 && positiveProfits.slice(0, 3).reduce((total, value) => total + value, 0) / positiveTotal > 0.6) alerts.push(alert("concentration", "medium", "Lucro concentrado em poucas apostas", "Grande parte do resultado positivo veio de apenas três registros.", "statistical"));
  if (!settings.lastExportedAt) alerts.push(alert("no-backup", "medium", "Você ainda não exportou um backup", "Seu histórico é parte da análise. Guarde uma cópia externa.", "backup"));
  else if (Date.now() - new Date(settings.lastExportedAt).getTime() > 7 * 86_400_000) alerts.push(alert("backup-late", "medium", "Backup atrasado", "O último arquivo exportado tem mais de 7 dias.", "backup"));
  if (betsSinceBackup > 20) alerts.push(alert("backup-bets", "medium", "Mais de 20 apostas sem backup", "Exporte uma cópia para proteger sua base estatística.", "backup"));
  if (metrics.activeBankroll >= rules.partialWithdrawalTarget && metrics.netRealProfit > 0) alerts.push(alert("partial-target", "low", "Meta parcial atingida", "Considere retirar parte do lucro conforme sua regra.", "gain"));
  return alerts;
}

function alert(id: string, severity: RiskAlert["severity"], title: string, description: string, category: RiskAlert["category"]): RiskAlert {
  return { id, severity, title, description, category };
}
