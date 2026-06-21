import { useMemo, useState } from "react";
import { IconAlertTriangle, IconArrowDown, IconArrowUp, IconChevronRight, IconLock, IconPlus, IconShield, IconTransfer, IconTrendingDown } from "@tabler/icons-react";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { currency, percent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BankrollChart } from "@/components/charts/BankrollChart";
import { BetForm } from "@/components/forms/BetForm";
import { MovementForm } from "@/components/forms/MovementForm";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { runMonteCarlo } from "@/lib/monteCarlo";

export function Today({ data, onOpenRules }: { data: ReturnTypeOfUseAppData; onOpenRules: () => void }) {
  const { metrics, rules, alerts, bets, movements } = data;
  const [betOpen, setBetOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [period, setPeriod] = useState("7d");
  const targetProgress = rules.finalTarget ? Math.max(0, Math.min(1, metrics.activeBankroll / rules.finalTarget)) : 0;
  const riskTitle = metrics.settledCount < 50 ? "Amostra ainda pequena" : metrics.currentDrawdown >= 0.1 ? "Drawdown elevado" : "Controle saudável";
  const simulation = useMemo(() => runMonteCarlo(data.simulationSettings, seededRandom(20260620)), [data.simulationSettings]);
  const periodDays = { "7d": 7, "30d": 30, "90d": 90, all: Number.POSITIVE_INFINITY }[period] ?? 7;
  const latestDate = [...bets.map((bet) => bet.date), ...movements.map((movement) => movement.date)].sort().at(-1);
  const cutoff = latestDate && Number.isFinite(periodDays) ? new Date(`${latestDate}T12:00:00`).getTime() - periodDays * 86_400_000 : 0;
  const visibleBets = bets.filter((bet) => !cutoff || new Date(`${bet.date}T12:00:00`).getTime() >= cutoff);
  const visibleMovements = movements.filter((movement) => !cutoff || new Date(`${movement.date}T12:00:00`).getTime() >= cutoff);

  return <>
    <header className="mb-4 flex items-start justify-between pt-1">
      <div><h1 className="m-0 text-4xl font-semibold tracking-tight">Hoje</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><IconLock className="size-4" />Dados somente neste dispositivo</p></div>
      <Button variant="ghost" size="icon" aria-label="Abrir regras" onClick={onOpenRules}><IconShield /></Button>
    </header>

    <div className="flex flex-col gap-3">
      <Card><CardContent className="grid grid-cols-[1fr_1fr_.92fr] gap-0 p-3">
        <MetricBlock label="Saldo disponível" value={currency.format(metrics.availableBankroll)} note={`Total ${currency.format(metrics.activeBankroll)}`} />
        <MetricBlock label="Lucro real (líquido)" value={currency.format(metrics.netRealProfit)} tone={metrics.netRealProfit >= 0 ? "positive" : "negative"} className="border-x px-3" />
        <div className="flex min-w-0 flex-col gap-1.5 pl-3"><span className="truncate text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Meta</span><strong className="tabular truncate text-sm">{currency.format(rules.finalTarget)} • {percent.format(targetProgress)}</strong><Progress value={targetProgress * 100} /><span className="truncate text-[9px] text-muted-foreground">Faltam {currency.format(Math.max(0, rules.finalTarget - metrics.activeBankroll))}</span></div>
      </CardContent></Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric icon={<IconArrowDown />} label="Depósitos" value={currency.format(metrics.totalDeposits)} />
        <MiniMetric icon={<IconArrowUp />} label="Saques" value={currency.format(metrics.totalWithdrawals)} />
        <MiniMetric icon={<IconLock />} label="Em apostas" value={currency.format(metrics.pendingExposure)} />
        <MiniMetric icon={<IconShield />} label="Capital próprio em risco" value={currency.format(metrics.ownCapitalAtRisk)} />
      </div>

      <Card>
        <CardHeader className="grid grid-cols-[1fr_auto] items-center p-3"><div><CardTitle>Evolução da banca</CardTitle><CardDescription className="hidden sm:block">Movimentos e resultados encerrados</CardDescription></div><ToggleGroup type="single" value={period} onValueChange={(value) => value && setPeriod(value)}><ToggleGroupItem className="px-2" value="7d">7D</ToggleGroupItem><ToggleGroupItem className="px-2" value="30d">30D</ToggleGroupItem><ToggleGroupItem className="px-2" value="90d">90D</ToggleGroupItem><ToggleGroupItem className="px-2" value="all">Tudo</ToggleGroupItem></ToggleGroup></CardHeader>
        <CardContent className="px-2 pb-2"><BankrollChart bets={visibleBets} movements={visibleMovements} /></CardContent>
      </Card>

      <Card><CardContent className="grid grid-cols-4 gap-px bg-border p-0"><Analytic label="ROI" value={percent.format(metrics.roi)} tone={metrics.roi >= 0 ? "positive" : "negative"} note="Depósitos" /><Analytic label="Win rate" value={percent.format(metrics.winRate)} note={`${metrics.settledCount} encerradas`} /><Analytic label="Edge" value={percent.format(metrics.observedEdge)} tone={metrics.observedEdge >= 0 ? "positive" : "negative"} note={`B/E ${percent.format(metrics.breakEven)}`} /><Analytic label="Drawdown" value={percent.format(-metrics.currentDrawdown)} tone={metrics.currentDrawdown >= 0.1 ? "negative" : undefined} note={`Máx. ${percent.format(-metrics.maxDrawdown)}`} /></CardContent></Card>

      <button type="button" onClick={onOpenRules} className="grid min-h-20 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-warning/50 bg-warning/5 p-3 text-left"><span className="flex size-10 items-center justify-center rounded-full border border-warning text-warning"><IconTrendingDown /></span><span><strong className="block text-xs uppercase tracking-wider text-warning">{riskTitle}</strong><span className="mt-1 block text-xs leading-relaxed text-secondary-foreground">{metrics.currentDrawdown >= 0.1 ? "Revise a exposição e os limites por aposta." : "Não extrapole resultados recentes."}</span></span><IconChevronRight className="text-muted-foreground" /></button>

      <Card><CardContent className="grid grid-cols-3 gap-px bg-border p-0"><SimulationSummary label="Prob. da meta" value={percent.format(simulation.probabilityOfTarget)} tone="positive" /><SimulationSummary label="Prob. do stop" value={percent.format(simulation.probabilityOfRuin)} tone="negative" /><SimulationSummary label="Sequência atual" value={metrics.currentStreak ? `${metrics.currentStreak}${metrics.currentStreakType === "win" ? "V" : "D"}` : "—"} /></CardContent></Card>

      <Card><CardHeader className="flex-row items-center justify-between p-3"><CardTitle>Alertas ativos</CardTitle><Badge variant={alerts.some((alert) => alert.severity === "high") ? "destructive" : "warning"}>{alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}</Badge></CardHeader><CardContent className="flex flex-col gap-0 p-0">{alerts.slice(0, 2).map((alert) => <button key={alert.id} type="button" onClick={onOpenRules} className="grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 border-t px-3 py-2 text-left"><IconAlertTriangle className={alert.severity === "high" ? "text-destructive" : "text-warning"} /><span><strong className="block text-xs">{alert.title}</strong><span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{alert.description}</span></span><IconChevronRight className="size-4 text-muted-foreground" /></button>)}</CardContent><CardFooter className="grid grid-cols-2 border-t p-2"><Button variant="outline" onClick={() => setBetOpen(true)}><IconPlus data-icon="inline-start" />Nova aposta</Button><Button variant="secondary" onClick={() => setMovementOpen(true)}><IconTransfer data-icon="inline-start" />Movimento</Button></CardFooter></Card>
    </div>
    <BetForm open={betOpen} onOpenChange={setBetOpen} rules={rules} activeBankroll={metrics.activeBankroll} />
    <MovementForm open={movementOpen} onOpenChange={setMovementOpen} activeBankroll={metrics.activeBankroll} />
  </>;
}

function MetricBlock({ label, value, note, tone, className = "" }: { label: string; value: string; note?: string; tone?: "positive" | "negative"; className?: string }) { return <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}><span className="min-h-5 text-[8px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">{label}</span><strong className={`tabular truncate text-sm sm:text-2xl ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-destructive" : ""}`}>{value}</strong>{note ? <span className="truncate text-[8px] text-muted-foreground">{note}</span> : null}</div>; }
function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card><CardContent className="flex min-h-24 flex-col justify-between p-3"><span className="flex size-8 items-center justify-center rounded-md border bg-secondary text-muted-foreground [&_svg]:size-4">{icon}</span><div><span className="block min-h-5 text-[8px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">{label}</span><strong className="tabular mt-1 block truncate text-sm sm:text-lg">{value}</strong></div></CardContent></Card>; }
function Analytic({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "positive" | "negative" }) { return <div className="flex min-h-24 flex-col items-center justify-center bg-card p-2 text-center"><span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span><strong className={`tabular mt-2 text-base ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-destructive" : ""}`}>{value}</strong><span className="mt-1 text-[9px] leading-tight text-muted-foreground">{note}</span></div>; }
function SimulationSummary({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) { return <div className="flex min-h-16 flex-col justify-center bg-card px-3"><span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span><strong className={`tabular mt-1 text-sm ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-destructive" : ""}`}>{value}</strong></div>; }
function seededRandom(seed: number) { let value = seed; return () => { value += 0x6d2b79f5; let result = value; result = Math.imul(result ^ result >>> 15, result | 1); result ^= result + Math.imul(result ^ result >>> 7, result | 61); return ((result ^ result >>> 14) >>> 0) / 4_294_967_296; }; }
