import { useMemo, useState, useTransition } from "react";
import { IconAlertTriangle, IconHistory, IconInfoCircle, IconPlayerPlay, IconReload } from "@tabler/icons-react";
import { toast } from "sonner";
import type { SimulationSettings } from "@/types";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { calibrateFromHistory, runMonteCarlo, type HistoryWindow } from "@/lib/monteCarlo";
import { db } from "@/db";
import { currency, percent, shortDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DistributionChart, PathsChart } from "@/components/charts/MonteCarloCharts";

export function Simulation({ data }: { data: ReturnTypeOfUseAppData }) {
  const [settings, setSettings] = useState<SimulationSettings>(data.simulationSettings);
  const [result, setResult] = useState(() => runMonteCarlo(data.simulationSettings));
  const [historyWindow, setHistoryWindow] = useState<HistoryWindow>(30);
  const [isPending, startTransition] = useTransition();
  const calibration = useMemo(
    () => calibrateFromHistory(data.bets, data.metrics.activeBankroll, historyWindow),
    [data.bets, data.metrics.activeBankroll, historyWindow]
  );
  const distributionReading = describeDistribution(result, settings);
  const pathsReading = describePaths(result, settings);

  function change<K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function runAndSave(next: SimulationSettings, message: string) {
    setSettings(next);
    startTransition(() => setResult(runMonteCarlo(next)));
    void db.simulationSettings.put(next);
    toast.success(message);
  }

  function simulate() {
    runAndSave(settings, "Simulação recalculada.");
  }

  function applyHistory() {
    if (!calibration) return;
    const next: SimulationSettings = {
      ...settings,
      initialBankroll: roundMoney(data.metrics.activeBankroll),
      averageOdds: round(calibration.averageOdds, 2),
      winProbability: calibration.winProbability,
      stakeMode: "fixed",
      fixedStake: roundMoney(calibration.averageStake),
      stakePercentage: Math.min(1, calibration.stakePercentage),
      maxStake: roundMoney(calibration.maximumStake),
      numberOfBets: calibration.count
    };
    runAndSave(next, `Histórico de ${calibration.count} apostas aplicado.`);
  }

  return <>
    <header className="mb-5 flex items-end justify-between pt-1">
      <div><h1 className="m-0 text-4xl font-semibold tracking-tight">Simulação</h1><p className="mt-2 text-sm text-muted-foreground">Monte Carlo para leitura de risco</p></div>
      <Button size="icon" aria-label="Executar simulação" disabled={isPending} onClick={simulate}>{isPending ? <IconReload className="animate-spin" /> : <IconPlayerPlay />}</Button>
    </header>
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader><CardTitle>Usar meu histórico</CardTitle><CardDescription>Preenche a simulação com o comportamento observado nas apostas encerradas</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ToggleGroup type="single" value={String(historyWindow)} onValueChange={(value) => value && setHistoryWindow(value === "all" ? "all" : Number(value) as 30 | 90)} className="grid grid-cols-3">
            <ToggleGroupItem value="30">30 dias</ToggleGroupItem><ToggleGroupItem value="90">90 dias</ToggleGroupItem><ToggleGroupItem value="all">Tudo</ToggleGroupItem>
          </ToggleGroup>
          <Explanation title="O que será usado?">
            {calibration ? `${calibration.count} apostas encerradas, de ${formatDate(calibration.firstDate)} a ${formatDate(calibration.lastDate)}. O app calcula taxa de acerto, odd média e valor médio/máximo apostado; apostas pendentes e anuladas ficam fora.` : "Ainda não há apostas encerradas nesse período."}
          </Explanation>
          {calibration && calibration.count < 30 ? <p className="m-0 text-xs text-warning">Amostra pequena: use o resultado apenas como exploração de risco.</p> : null}
          <Button size="lg" variant="secondary" disabled={!calibration || isPending} onClick={applyHistory}><IconHistory data-icon="inline-start" />Aplicar histórico e simular</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Parâmetros</CardTitle><CardDescription>Vitórias e perdas são sorteadas em milhares de futuros possíveis</CardDescription></CardHeader>
        <CardContent><FieldGroup>
          <div className="grid grid-cols-2 gap-3"><NumberField label="Banca inicial" value={settings.initialBankroll} onChange={(value) => change("initialBankroll", value)} /><NumberField label="Meta" value={settings.targetBankroll} onChange={(value) => change("targetBankroll", value)} /><NumberField label="Stop da banca" value={settings.stopBankroll} onChange={(value) => change("stopBankroll", value)} /><NumberField label="Odd média" value={settings.averageOdds} step={0.01} onChange={(value) => change("averageOdds", value)} /></div>
          <Field><FieldLabel>Probabilidade de acerto (%)</FieldLabel><Input type="number" inputMode="decimal" min="0" max="100" step="0.1" value={settings.winProbability * 100} onChange={(event) => change("winProbability", Number(event.target.value) / 100)} /><FieldDescription>Use uma estimativa conservadora. Resultado passado não confirma essa taxa futura.</FieldDescription></Field>
          <Field><FieldLabel>Como definir o valor por aposta?</FieldLabel><ToggleGroup type="single" value={settings.stakeMode} onValueChange={(value) => value && change("stakeMode", value as SimulationSettings["stakeMode"])} className="grid grid-cols-2"><ToggleGroupItem value="fixed">Valor fixo</ToggleGroupItem><ToggleGroupItem value="percentage">% da banca</ToggleGroupItem></ToggleGroup><FieldDescription>“Stake” é apenas o valor de dinheiro colocado em cada aposta.</FieldDescription></Field>
          <div className="grid grid-cols-2 gap-3">{settings.stakeMode === "fixed" ? <NumberField label="Valor por aposta" value={settings.fixedStake} onChange={(value) => change("fixedStake", value)} /> : <NumberField label="Percentual por aposta" value={settings.stakePercentage * 100} step={0.1} onChange={(value) => change("stakePercentage", value / 100)} />}<NumberField label="Limite por aposta" value={settings.maxStake} onChange={(value) => change("maxStake", value)} /><NumberField label="Apostas futuras" value={settings.numberOfBets} onChange={(value) => change("numberOfBets", Math.max(1, Math.round(value)))} /><NumberField label="Quantidade de simulações" value={settings.numberOfSimulations} onChange={(value) => change("numberOfSimulations", Math.max(100, Math.min(10000, Math.round(value))))} /></div>
          <Button size="lg" onClick={simulate} disabled={isPending}><IconPlayerPlay data-icon="inline-start" />{isPending ? "Calculando..." : "Executar simulação"}</Button>
        </FieldGroup></CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Result label="Prob. da meta" value={percent.format(result.probabilityOfTarget)} tone="positive" /><Result label="Prob. do stop" value={percent.format(result.probabilityOfRuin)} tone="negative" /><Result label="Mediana final" value={currency.format(result.medianFinalBankroll)} /><Result label="Drawdown médio" value={percent.format(-result.averageMaxDrawdown)} tone="warning" /></div>

      <Card><CardHeader><CardTitle>Distribuição final</CardTitle><CardDescription>P10 {currency.format(result.p10FinalBankroll)} · P90 {currency.format(result.p90FinalBankroll)}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Explanation title="Leitura deste cenário">{distributionReading}</Explanation><DistributionChart result={result} /></CardContent></Card>

      <Card><CardHeader><CardTitle>Caminhos simulados</CardTitle><CardDescription>Oito exemplos entre milhares de trajetórias calculadas</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Explanation title="Leitura destes 8 caminhos">{pathsReading}</Explanation><PathsChart result={result} /></CardContent></Card>

      <div className="rounded-lg border border-warning/50 bg-warning/5 p-4"><IconAlertTriangle className="mb-2 text-warning" /><strong className="block text-sm text-warning">Simulação não valida uma estratégia.</strong><p className="mb-0 mt-1 text-sm leading-relaxed text-muted-foreground">Ela expõe o que pode acontecer sob premissas escolhidas. A incerteza real pode ser maior.</p></div>
    </div>
  </>;
}

function Explanation({ title, children }: { title: string; children: React.ReactNode }) { return <div className="grid grid-cols-[auto_1fr] gap-2 rounded-md border bg-secondary/60 p-3"><IconInfoCircle className="mt-0.5 size-4 text-primary" /><div><strong className="block text-xs">{title}</strong><p className="mb-0 mt-1 text-xs leading-relaxed text-muted-foreground">{children}</p></div></div>; }
function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (value: number) => void; step?: number }) { return <Field><FieldLabel>{label}</FieldLabel><Input type="number" inputMode="decimal" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></Field>; }
function Result({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" | "warning" }) { return <Card><CardContent className="flex min-h-24 flex-col justify-center p-3"><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><strong className={`tabular mt-2 text-lg ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-destructive" : tone === "warning" ? "text-warning" : ""}`}>{value}</strong></CardContent></Card>; }
function formatDate(date: string) { return shortDate.format(new Date(`${date}T12:00:00`)); }
function round(value: number, digits: number) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }
function roundMoney(value: number) { return round(value, 2); }

function describeDistribution(result: ReturnType<typeof runMonteCarlo>, settings: SimulationSettings) {
  const bucket = result.distribution.reduce((mostCommon, current) => current.count > mostCommon.count ? current : mostCommon, result.distribution[0]);
  if (!bucket) return "A simulação ainda não produziu uma distribuição.";
  const total = result.distribution.reduce((sum, item) => sum + item.count, 0);
  const target = result.probabilityOfTarget > 0
    ? `${percent.format(result.probabilityOfTarget)} chegaram à meta, em média após ${Math.round(result.averageBetsToTarget)} apostas.`
    : `Nenhuma chegou à meta de ${currency.format(settings.targetBankroll)} dentro do horizonte escolhido.`;
  const stop = result.probabilityOfRuin > 0
    ? ` ${percent.format(result.probabilityOfRuin)} tocaram o stop de ${currency.format(settings.stopBankroll)}.`
    : " Nenhuma tocou o stop.";
  return `A faixa final mais frequente foi de ${currency.format(bucket.start)} a ${currency.format(bucket.end)}: ${bucket.count} de ${total} simulações (${percent.format(bucket.count / total)}). Isso mostra onde a banca terminou mais vezes após até ${settings.numberOfBets} apostas; não é a quantidade de apostas necessária para chegar à meta. ${target}${stop}`;
}

function describePaths(result: ReturnType<typeof runMonteCarlo>, settings: SimulationSettings) {
  const finalPoint = result.paths.at(-1);
  const finalValues = finalPoint ? Object.entries(finalPoint).filter(([key]) => key !== "bet").map(([, value]) => Number(value)) : [];
  if (!finalValues.length) return "Ainda não há caminhos para interpretar.";
  const above = finalValues.filter((value) => value > settings.initialBankroll).length;
  const below = finalValues.filter((value) => value < settings.initialBankroll).length;
  const valueRule = settings.stakeMode === "fixed" ? currency.format(settings.fixedStake) : percent.format(settings.stakePercentage);
  return `Nestes oito exemplos, ${above} terminaram acima e ${below} abaixo da banca inicial, entre ${currency.format(Math.min(...finalValues))} e ${currency.format(Math.max(...finalValues))}. Todos usam odd média ${settings.averageOdds.toFixed(2)}, acerto de ${percent.format(settings.winProbability)} e ${valueRule} por aposta; muda apenas a ordem sorteada de vitórias e perdas. As oito linhas ilustram trajetórias, mas não medem frequência — quem resume todas as ${settings.numberOfSimulations} simulações são as barras acima.`;
}
