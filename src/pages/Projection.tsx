import { useMemo, useState } from "react";
import { IconAlertTriangle, IconCalendarStats, IconTargetArrow } from "@tabler/icons-react";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { buildProjection } from "@/lib/projections";
import { currency } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function Projection({ data }: { data: ReturnTypeOfUseAppData }) {
  const [expectedReturn, setExpectedReturn] = useState(2);
  const [cyclesPerWeek, setCyclesPerWeek] = useState(5);
  const [initial, setInitial] = useState(data.metrics.activeBankroll || 100);
  const [target, setTarget] = useState(data.rules.finalTarget);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const scenarios = useMemo(() => buildProjection({ initialBankroll: initial, targetBankroll: target, expectedReturnPerCycle: expectedReturn / 100, cyclesPerWeek, startDate }), [cyclesPerWeek, expectedReturn, initial, startDate, target]);
  const daysSinceStart = Math.max(0, (Date.now() - new Date(startDate).getTime()) / 86_400_000);
  const expectedCyclesToday = Math.floor(daysSinceStart / 7 * cyclesPerWeek);
  const expectedToday = initial * (1 + expectedReturn / 100) ** expectedCyclesToday;

  return <>
    <header className="mb-5 pt-1"><h1 className="m-0 text-4xl font-semibold tracking-tight">Projeção</h1><p className="mt-2 text-sm text-muted-foreground">Cenários condicionais, não promessas</p></header>
    <div className="flex flex-col gap-3">
      <Alert className="border-warning/50 bg-warning/5"><IconAlertTriangle className="mb-2 text-warning" /><AlertTitle className="text-warning">Projeção não é previsão.</AlertTitle><AlertDescription>Ela depende de edge real, disciplina de stake e amostra estatística suficiente.</AlertDescription></Alert>
      <Card><CardHeader><CardTitle>Premissas</CardTitle><CardDescription>Ajuste os parâmetros para comparar cenários</CardDescription></CardHeader><CardContent><FieldGroup><div className="grid grid-cols-2 gap-3"><Field><FieldLabel>Banca inicial</FieldLabel><Input type="number" inputMode="decimal" value={initial} onChange={(event) => setInitial(Number(event.target.value))} /></Field><Field><FieldLabel>Meta final</FieldLabel><Input type="number" inputMode="decimal" value={target} onChange={(event) => setTarget(Number(event.target.value))} /></Field></div><div className="grid grid-cols-2 gap-3"><Field><FieldLabel>Retorno por ciclo (%)</FieldLabel><Input type="number" inputMode="decimal" step="0.1" value={expectedReturn} onChange={(event) => setExpectedReturn(Number(event.target.value))} /></Field><Field><FieldLabel>Ciclos por semana</FieldLabel><Input type="number" min="1" value={cyclesPerWeek} onChange={(event) => setCyclesPerWeek(Number(event.target.value))} /></Field></div><Field><FieldLabel>Data inicial</FieldLabel><Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></Field></FieldGroup></CardContent></Card>
      <Card><CardHeader><CardTitle>Curvas projetadas</CardTitle><CardDescription>A linha amarela marca a banca real de hoje</CardDescription></CardHeader><CardContent><ProjectionChart scenarios={scenarios} currentBankroll={data.metrics.activeBankroll} /></CardContent></Card>
      <div className="grid gap-2 sm:grid-cols-3">{scenarios.map((scenario) => <Card key={scenario.name}><CardContent className="flex min-h-32 flex-col justify-between p-4"><div className="flex items-center justify-between"><Badge variant={scenario.name === "Base" ? "default" : "secondary"}>{scenario.name}</Badge><IconCalendarStats className="size-5 text-muted-foreground" /></div><div><strong className="tabular block text-xl">{scenario.cycles} ciclos</strong><span className="mt-1 block text-xs text-muted-foreground">{scenario.estimatedDate ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(scenario.estimatedDate)) : "Sem data estimada"}</span></div></CardContent></Card>)}</div>
      <Card><CardContent className="grid gap-4 pt-4 sm:grid-cols-3"><Summary icon={<IconTargetArrow />} label="Falta para a meta" value={currency.format(Math.max(0, target - data.metrics.activeBankroll))} /><Summary icon={<IconCalendarStats />} label="Banca esperada hoje" value={currency.format(expectedToday)} /><Summary icon={<IconTargetArrow />} label="Diferença do plano" value={currency.format(data.metrics.activeBankroll - expectedToday)} /></CardContent></Card>
    </div>
  </>;
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3"><span className="text-primary [&_svg]:size-5">{icon}</span><div><span className="block text-xs text-muted-foreground">{label}</span><strong className="tabular mt-1 block">{value}</strong></div></div>; }
