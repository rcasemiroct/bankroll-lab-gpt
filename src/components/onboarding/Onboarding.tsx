import { useState } from "react";
import { IconArrowRight, IconDatabase, IconShieldCheck } from "@tabler/icons-react";
import type { Settings } from "@/types";
import { seedExampleData, startClean } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [initialBankroll, setInitialBankroll] = useState(100);
  const [target, setTarget] = useState(5000);
  const [dailyStop, setDailyStop] = useState(5);
  const [maxStake, setMaxStake] = useState(2);
  const [profile, setProfile] = useState<Settings["alertProfile"]>("conservative");
  const steps = [
    <><IconShieldCheck className="size-12 text-primary" stroke={1.5} /><h1 className="text-3xl font-semibold">Controle antes de resultado.</h1><p className="text-base leading-relaxed text-muted-foreground">Este app não recomenda apostas. Ele ajuda você a controlar banca, risco e disciplina.</p></>,
    <><h2 className="text-2xl font-semibold">Defina os limites</h2><FieldGroup><Field><FieldLabel>Banca inicial</FieldLabel><Input type="number" inputMode="decimal" value={initialBankroll} onChange={(event) => setInitialBankroll(Number(event.target.value))} /></Field><Field><FieldLabel>Meta final</FieldLabel><Input type="number" inputMode="decimal" value={target} onChange={(event) => setTarget(Number(event.target.value))} /></Field><div className="grid grid-cols-2 gap-3"><Field><FieldLabel>Stop diário (%)</FieldLabel><Input type="number" value={dailyStop} onChange={(event) => setDailyStop(Number(event.target.value))} /></Field><Field><FieldLabel>Stake máxima (%)</FieldLabel><Input type="number" value={maxStake} onChange={(event) => setMaxStake(Number(event.target.value))} /></Field></div></FieldGroup></>,
    <><h2 className="text-2xl font-semibold">Perfil de alerta</h2><p className="text-sm text-muted-foreground">Isso muda a sensibilidade dos avisos, nunca cria recomendações de entrada.</p><ToggleGroup type="single" value={profile} onValueChange={(value) => value && setProfile(value as Settings["alertProfile"])} className="grid grid-cols-3"><ToggleGroupItem value="conservative">Conservador</ToggleGroupItem><ToggleGroupItem value="moderate">Moderado</ToggleGroupItem><ToggleGroupItem value="custom">Personalizado</ToggleGroupItem></ToggleGroup></>,
    <><IconDatabase className="size-12 text-warning" stroke={1.5} /><h2 className="text-2xl font-semibold">Histórico não é certeza.</h2><p className="text-base leading-relaxed text-muted-foreground">Resultados recentes não provam edge. Use histórico, amostra e controle de risco.</p><FieldDescription>Os dados ficam somente neste dispositivo. IndexedDB não substitui um backup externo.</FieldDescription></>
  ];
  async function finish(useSamples: boolean) { if (useSamples) await seedExampleData(); else await startClean(initialBankroll, target, maxStake / 100, dailyStop / 100, profile); }
  return <div className="flex min-h-dvh items-center justify-center p-4 surface-grid"><Card className="w-full max-w-md"><CardHeader><div className="mb-3 flex gap-1">{steps.map((_, index) => <span key={index} className={index <= step ? "h-1 flex-1 bg-primary" : "h-1 flex-1 bg-secondary"} />)}</div><CardTitle>Bankroll Lab • {step + 1} de 4</CardTitle><CardDescription>Privado, offline e sem login.</CardDescription></CardHeader><CardContent><div className="flex min-h-72 flex-col gap-5">{steps[step]}</div><div className="mt-5 flex gap-2">{step > 0 ? <Button variant="outline" onClick={() => setStep(step - 1)}>Voltar</Button> : null}{step < 3 ? <Button className="ml-auto" onClick={() => setStep(step + 1)}>Continuar<IconArrowRight data-icon="inline-end" /></Button> : <><Button variant="outline" className="flex-1" onClick={() => finish(true)}>Usar exemplo</Button><Button className="flex-1" onClick={() => finish(false)}>Começar limpo</Button></>}</div></CardContent></Card></div>;
}
