import { useDeferredValue, useMemo, useState } from "react";
import { IconAdjustments, IconChevronRight, IconPlus, IconSearch } from "@tabler/icons-react";
import type { Bet, BetStatus } from "@/types";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { calculateStrategyMetrics } from "@/lib/calculations";
import { currency, percent, shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BetForm } from "@/components/forms/BetForm";

export function Bets({ data }: { data: ReturnTypeOfUseAppData }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.toLowerCase());
  const [status, setStatus] = useState<BetStatus | "all">("all");
  const [strategy, setStrategy] = useState("all");
  const [sportsbook, setSportsbook] = useState("all");
  const [selected, setSelected] = useState<Bet | undefined>();
  const [open, setOpen] = useState(false);
  const strategies = [...new Set(data.bets.map((bet) => bet.strategy).filter(Boolean))];
  const sportsbooks = [...new Set(data.bets.map((bet) => bet.sportsbook).filter(Boolean))];
  const filtered = useMemo(() => data.bets.filter((bet) => {
    const text = `${bet.event} ${bet.market} ${bet.strategy} ${bet.sportsbook}`.toLowerCase();
    return text.includes(deferredQuery) && (status === "all" || bet.status === status) && (strategy === "all" || bet.strategy === strategy) && (sportsbook === "all" || bet.sportsbook === sportsbook);
  }), [data.bets, deferredQuery, sportsbook, status, strategy]);
  const strategyMetrics = calculateStrategyMetrics(data.bets, data.rules.minimumStrategyBets);
  function create() { setSelected(undefined); setOpen(true); }
  function edit(bet: Bet) { setSelected(bet); setOpen(true); }

  return <>
    <header className="mb-5 flex items-end justify-between pt-1"><div><h1 className="m-0 text-4xl font-semibold tracking-tight">Apostas</h1><p className="mt-2 text-sm text-muted-foreground">Registro e leitura da amostra</p></div><Button size="icon" aria-label="Nova aposta" onClick={create}><IconPlus /></Button></header>
    <div className="flex flex-col gap-3">
      <Card><CardContent className="flex flex-col gap-3 pt-4"><label className="relative block"><IconSearch className="pointer-events-none absolute left-3 top-3.5 size-5 text-muted-foreground" /><Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar evento, mercado ou estratégia" /></label><div className="grid grid-cols-3 gap-2"><Select value={status} onValueChange={(value: BetStatus | "all") => setStatus(value)}><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">Status</SelectItem><SelectItem value="pending">Pendentes</SelectItem><SelectItem value="win">Ganhas</SelectItem><SelectItem value="loss">Perdidas</SelectItem><SelectItem value="void">Anuladas</SelectItem></SelectGroup></SelectContent></Select><Select value={strategy} onValueChange={setStrategy}><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">Estratégia</SelectItem>{strategies.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select><Select value={sportsbook} onValueChange={setSportsbook}><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">Casa</SelectItem>{sportsbooks.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectGroup></SelectContent></Select></div></CardContent></Card>

      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Registros</CardTitle><CardDescription>{filtered.length} de {data.bets.length} apostas</CardDescription></div><IconAdjustments className="size-5 text-muted-foreground" /></CardHeader><CardContent className="p-0">{filtered.length ? filtered.map((bet) => <button key={bet.id} type="button" onClick={() => edit(bet)} className="grid min-h-20 w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-t px-4 py-3 text-left"><div className="min-w-0"><span className="block truncate text-sm font-semibold">{bet.event}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{shortDate.format(new Date(`${bet.date}T12:00:00`))} • {bet.market} • {bet.strategy || "Sem estratégia"}</span></div><div className="text-right"><span className="tabular block text-xs text-muted-foreground">@ {bet.odds.toFixed(2)}</span><span className="tabular mt-1 block text-sm">{currency.format(bet.stake)}</span></div><div className="flex items-center gap-2"><Badge variant={statusVariant(bet.status)}>{statusLabel(bet.status)}</Badge><span className={`tabular w-16 text-right text-sm font-semibold ${bet.profit > 0 ? "text-positive" : bet.profit < 0 ? "text-destructive" : "text-muted-foreground"}`}>{currency.format(bet.profit)}</span><IconChevronRight className="size-4 text-muted-foreground" /></div></button>) : <div className="p-8 text-center text-sm text-muted-foreground">Nenhum registro corresponde aos filtros.</div>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Análise por estratégia</CardTitle><CardDescription>Resultado observado, nunca garantia futura</CardDescription></CardHeader><CardContent className="flex flex-col gap-0 p-0">{strategyMetrics.map((item) => <div key={item.strategy} className="grid grid-cols-[1fr_auto] gap-3 border-t px-4 py-4"><div><strong className="text-sm">{item.strategy}</strong><p className="mt-1 text-xs text-muted-foreground">{item.count} apostas • odd {item.averageOdds.toFixed(2)} • win rate {percent.format(item.winRate)}</p></div><div className="text-right"><span className={`tabular block font-semibold ${item.profit >= 0 ? "text-positive" : "text-destructive"}`}>{currency.format(item.profit)}</span><Badge variant={item.status === "Mais consistente" ? "positive" : item.status === "Negativa até agora" || item.status === "Risco elevado" ? "destructive" : "secondary"}>{item.status}</Badge></div></div>)}</CardContent></Card>
    </div>
    <BetForm open={open} onOpenChange={setOpen} bet={selected} rules={data.rules} activeBankroll={data.metrics.activeBankroll} />
  </>;
}

function statusLabel(status: BetStatus) { return { pending: "Pendente", win: "Ganha", loss: "Perdida", void: "Anulada" }[status]; }
function statusVariant(status: BetStatus): "warning" | "positive" | "destructive" | "secondary" { return { pending: "warning", win: "positive", loss: "destructive", void: "secondary" }[status] as "warning" | "positive" | "destructive" | "secondary"; }
