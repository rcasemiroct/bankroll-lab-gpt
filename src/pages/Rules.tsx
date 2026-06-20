import { useState } from "react";
import { IconAlertTriangle, IconChartBar, IconDownload, IconShieldCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import type { Rules as RulesType } from "@/types";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { db } from "@/db";
import { calculateStrategyMetrics } from "@/lib/calculations";
import { currency, percent } from "@/lib/utils";
import { Backups } from "@/pages/Backups";
import { Settings } from "@/pages/Settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Rules({ data }: { data: ReturnTypeOfUseAppData }) {
  const [draft, setDraft] = useState(data.rules);
  async function save<K extends keyof RulesType>(key: K, value: RulesType[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    await db.rules.put(next);
    toast.success("Regra atualizada.");
  }

  return <>
    <header className="mb-5 pt-1"><h1 className="m-0 text-4xl font-semibold tracking-tight">Regras</h1><p className="mt-2 text-sm text-muted-foreground">Limites pessoais, alertas e proteção de dados</p></header>
    <Tabs defaultValue="rules">
      <TabsList className="mb-3 grid w-full grid-cols-3"><TabsTrigger value="rules">Regras</TabsTrigger><TabsTrigger value="reports">Relatório</TabsTrigger><TabsTrigger value="backups">Backups</TabsTrigger></TabsList>
      <TabsContent value="rules">
        <div className="flex flex-col gap-3">
          <Card><CardHeader><CardTitle>Limites pessoais</CardTitle><CardDescription>Valores prudentes sugeridos, totalmente configuráveis</CardDescription></CardHeader><CardContent><FieldGroup>
            <div className="grid grid-cols-2 gap-3"><PercentRule label="Stake máxima" value={draft.maxStakePercentage} onSave={(value) => save("maxStakePercentage", value)} /><PercentRule label="Alerta forte" value={draft.strongAlertPercentage} onSave={(value) => save("strongAlertPercentage", value)} /><PercentRule label="Stop diário" value={draft.dailyStopPercentage} onSave={(value) => save("dailyStopPercentage", value)} /><PercentRule label="Stop semanal" value={draft.weeklyStopPercentage} onSave={(value) => save("weeklyStopPercentage", value)} /></div>
            <div className="grid grid-cols-2 gap-3"><MoneyRule label="Meta parcial" value={draft.partialWithdrawalTarget} onSave={(value) => save("partialWithdrawalTarget", value)} /><MoneyRule label="Meta final" value={draft.finalTarget} onSave={(value) => save("finalTarget", value)} /></div>
            <div className="grid grid-cols-2 gap-3"><NumberRule label="Pausa após perdas" value={draft.pauseAfterLosses} onSave={(value) => save("pauseAfterLosses", value)} /><NumberRule label="Amostra mínima" value={draft.minimumStrategyBets} onSave={(value) => save("minimumStrategyBets", value)} /></div>
            <PercentRule label="Retirada na meta parcial" value={draft.withdrawalPercentage} onSave={(value) => save("withdrawalPercentage", value)} />
            <Field orientation="horizontal"><div><FieldLabel>Pausa obrigatória após stop</FieldLabel><FieldDescription>O app sinaliza que novos registros violam a regra.</FieldDescription></div><Switch checked={draft.pauseAfterStop} onCheckedChange={(value) => save("pauseAfterStop", value)} /></Field>
          </FieldGroup></CardContent></Card>
          <Alert className="border-primary/30"><IconShieldCheck className="mb-2 text-primary" /><AlertTitle>Nunca aumentar stake para recuperar perda.</AlertTitle><AlertDescription>Essa regra é permanente na linguagem e nos alertas do produto.</AlertDescription></Alert>
          <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Alertas internos</CardTitle><CardDescription>{data.alerts.length} condições ativas agora</CardDescription></div><Badge variant={data.alerts.some((item) => item.severity === "high") ? "destructive" : "warning"}>{data.alerts.some((item) => item.severity === "high") ? "Revisar" : "Monitorar"}</Badge></CardHeader><CardContent className="p-0">{data.alerts.map((item) => <div key={item.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-t px-4 py-4"><IconAlertTriangle className={item.severity === "high" ? "text-destructive" : "text-warning"} /><div><strong className="text-sm">{item.title}</strong><p className="mb-0 mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p></div><Badge variant={item.severity === "high" ? "destructive" : item.severity === "medium" ? "warning" : "secondary"}>{item.severity === "high" ? "Alta" : item.severity === "medium" ? "Média" : "Baixa"}</Badge></div>)}</CardContent></Card>
          <Settings data={data} />
        </div>
      </TabsContent>
      <TabsContent value="reports"><MonthlyReport data={data} /></TabsContent>
      <TabsContent value="backups"><Backups data={data} /></TabsContent>
    </Tabs>
  </>;
}

function PercentRule({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => void }) { return <Field><FieldLabel>{label} (%)</FieldLabel><Input type="number" inputMode="decimal" step="0.1" value={value * 100} onChange={(event) => onSave(Number(event.target.value) / 100)} /></Field>; }
function MoneyRule({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => void }) { return <Field><FieldLabel>{label}</FieldLabel><Input type="number" inputMode="decimal" step="10" value={value} onChange={(event) => onSave(Number(event.target.value))} /></Field>; }
function NumberRule({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => void }) { return <Field><FieldLabel>{label}</FieldLabel><Input type="number" min="1" value={value} onChange={(event) => onSave(Number(event.target.value))} /></Field>; }

function MonthlyReport({ data }: { data: ReturnTypeOfUseAppData }) {
  const month = new Date().toISOString().slice(0, 7);
  const storedReport = data.monthlyReports.find((item) => item.month === month);
  const [comments, setComments] = useState(storedReport?.comments ?? "");
  const bets = data.bets.filter((bet) => bet.date.startsWith(month));
  const movements = data.movements.filter((movement) => movement.date.startsWith(month));
  const profit = bets.reduce((total, bet) => total + bet.profit, 0);
  const stake = bets.reduce((total, bet) => total + bet.stake, 0);
  const wins = bets.filter((bet) => bet.status === "win").length;
  const decided = bets.filter((bet) => bet.status === "win" || bet.status === "loss").length;
  const deposits = movements.filter((item) => item.type === "deposit").reduce((total, item) => total + item.amount, 0);
  const withdrawals = movements.filter((item) => item.type === "withdrawal").reduce((total, item) => total + item.amount, 0);
  const ranked = calculateStrategyMetrics(bets, data.rules.minimumStrategyBets).sort((a, b) => b.profit - a.profit);
  const best = ranked[0];
  const worst = ranked.at(-1);

  async function saveComments() {
    if (comments === (storedReport?.comments ?? "")) return;
    const now = new Date().toISOString();
    await db.monthlyReports.put({ id: month, month, comments, createdAt: storedReport?.createdAt ?? now, updatedAt: now });
    toast.success("Comentários do mês salvos.");
  }

  function exportReport(format: "json" | "csv") {
    const report = { month, result: profit, deposits, withdrawals, netProfit: data.metrics.netRealProfit, maxDrawdown: data.metrics.maxDrawdown, bets: bets.length, averageStake: bets.length ? stake / bets.length : 0, averageOdds: bets.length ? bets.reduce((total, bet) => total + bet.odds, 0) / bets.length : 0, winRate: decided ? wins / decided : 0, bestStrategy: best?.strategy ?? "Sem amostra", worstStrategy: worst?.strategy ?? "Sem amostra", activeAlerts: data.alerts.length, comments };
    const content = format === "json" ? JSON.stringify(report, null, 2) : `${Object.keys(report).join(",")}\n${Object.values(report).map((value) => JSON.stringify(value)).join(",")}`;
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bankroll-lab-relatorio-${month}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="flex flex-col gap-3">
    <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Relatório mensal</CardTitle><CardDescription>{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`))}</CardDescription></div><IconChartBar className="text-primary" /></CardHeader><CardContent className="grid grid-cols-2 gap-px bg-border p-0 sm:grid-cols-3"><ReportMetric label="Resultado" value={currency.format(profit)} /><ReportMetric label="Depósitos" value={currency.format(deposits)} /><ReportMetric label="Retiradas" value={currency.format(withdrawals)} /><ReportMetric label="Apostas" value={String(bets.length)} /><ReportMetric label="Stake média" value={currency.format(bets.length ? stake / bets.length : 0)} /><ReportMetric label="Win rate" value={percent.format(decided ? wins / decided : 0)} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Leitura do mês</CardTitle><CardDescription>Maior drawdown: {percent.format(-data.metrics.maxDrawdown)} · {data.alerts.length} alertas ativos</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-md bg-secondary p-3"><span className="block text-xs text-muted-foreground">Melhor estratégia</span><strong className="mt-1 block">{best?.strategy ?? "Sem amostra"}</strong></div><div className="rounded-md bg-secondary p-3"><span className="block text-xs text-muted-foreground">Pior estratégia</span><strong className="mt-1 block">{worst?.strategy ?? "Sem amostra"}</strong></div></div><textarea value={comments} onChange={(event) => setComments(event.target.value)} onBlur={saveComments} className="min-h-32 w-full resize-none rounded-md border bg-secondary p-3 text-sm" placeholder="Comentários manuais sobre disciplina, desvios e aprendizados..." /><p className="m-0 text-xs text-muted-foreground">Os comentários são salvos neste aparelho ao sair do campo.</p></CardContent></Card>
    <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => exportReport("csv")}><IconDownload data-icon="inline-start" />CSV</Button><Button variant="outline" onClick={() => exportReport("json")}><IconDownload data-icon="inline-start" />JSON</Button></div>
  </div>;
}

function ReportMetric({ label, value }: { label: string; value: string }) { return <div className="flex min-h-24 flex-col justify-center bg-card p-4"><span className="text-xs text-muted-foreground">{label}</span><strong className="tabular mt-1 text-lg">{value}</strong></div>; }
