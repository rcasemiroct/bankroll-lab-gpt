import { useEffect, useState } from "react";
import { IconCheck, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { db } from "@/db";
import { calculateBetProfit } from "@/lib/calculations";
import type { Bet, BetStatus, Rules } from "@/types";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSnapshot } from "@/lib/backup";

const emptyBet = (): Bet => ({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), sportsbook: "", event: "", market: "", strategy: "", odds: 1.9, stake: 20, status: "pending", returnAmount: 0, profit: 0, notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

export function BetForm({ open, onOpenChange, bet, rules, activeBankroll }: { open: boolean; onOpenChange: (open: boolean) => void; bet?: Bet; rules: Rules; activeBankroll: number }) {
  const [draft, setDraft] = useState<Bet>(bet ?? emptyBet());
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { setDraft(bet ?? emptyBet()); setConfirmed(false); }, [bet, open]);
  const stakePercentage = activeBankroll > 0 ? draft.stake / activeBankroll : 0;
  const invalid = !draft.event.trim() || !draft.market.trim() || !draft.strategy.trim() || draft.odds <= 1 || draft.stake <= 0;

  async function save() {
    if (invalid) return;
    if (!confirmed) { setConfirmed(true); return; }
    const now = new Date().toISOString();
    const profit = calculateBetProfit(draft.status, draft.stake, draft.odds);
    await db.bets.put({ ...draft, profit, returnAmount: draft.status === "win" ? draft.stake * draft.odds : draft.status === "void" ? draft.stake : 0, updatedAt: now });
    const count = await db.bets.count();
    if (!bet && count % 10 === 0) await createSnapshot("after_10_bets");
    toast.success(bet ? "Aposta atualizada." : "Aposta registrada.");
    onOpenChange(false);
  }

  async function remove() {
    if (!bet) return;
    await db.bets.delete(bet.id);
    toast.success("Registro apagado.");
    onOpenChange(false);
  }

  return <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent>
      <DrawerHeader><DrawerTitle>{bet ? "Editar aposta" : "Nova aposta"}</DrawerTitle><DrawerDescription>Registre o que já foi decidido. O app não recomenda entradas.</DrawerDescription></DrawerHeader>
      <div className="overflow-y-auto px-5 pb-5 scrollbar-none">
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field><FieldLabel htmlFor="bet-date">Data</FieldLabel><Input id="bet-date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></Field>
            <Field><FieldLabel>Status</FieldLabel><Select value={draft.status} onValueChange={(value: BetStatus) => setDraft({ ...draft, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="pending">Pendente</SelectItem><SelectItem value="win">Ganha</SelectItem><SelectItem value="loss">Perdida</SelectItem><SelectItem value="void">Anulada</SelectItem></SelectGroup></SelectContent></Select></Field>
          </div>
          <Field data-invalid={!draft.event.trim()}><FieldLabel htmlFor="bet-event">Evento</FieldLabel><Input id="bet-event" value={draft.event} onChange={(event) => setDraft({ ...draft, event: event.target.value })} placeholder="Identificação do evento" aria-invalid={!draft.event.trim()} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="bet-market">Mercado</FieldLabel><Input id="bet-market" value={draft.market} onChange={(event) => setDraft({ ...draft, market: event.target.value })} placeholder="Mercado" /></Field><Field><FieldLabel htmlFor="bet-book">Casa</FieldLabel><Input id="bet-book" value={draft.sportsbook} onChange={(event) => setDraft({ ...draft, sportsbook: event.target.value })} placeholder="Opcional" /></Field></div>
          <Field data-invalid={!draft.strategy.trim()}><FieldLabel htmlFor="bet-strategy">Estratégia</FieldLabel><Input id="bet-strategy" value={draft.strategy} onChange={(event) => setDraft({ ...draft, strategy: event.target.value })} placeholder="Regra ou hipótese testada" aria-invalid={!draft.strategy.trim()} /><FieldDescription>Sem estratégia, não há como analisar consistência.</FieldDescription></Field>
          <div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="bet-odds">Odd decimal</FieldLabel><Input id="bet-odds" type="number" inputMode="decimal" min="1.01" step="0.01" value={draft.odds} onChange={(event) => setDraft({ ...draft, odds: Number(event.target.value) })} /></Field><Field><FieldLabel htmlFor="bet-stake">Valor apostado (stake)</FieldLabel><Input id="bet-stake" type="number" inputMode="decimal" min="0" step="0.01" value={draft.stake} onChange={(event) => setDraft({ ...draft, stake: Number(event.target.value) })} /><FieldDescription className={stakePercentage > rules.strongAlertPercentage ? "text-destructive" : stakePercentage > rules.maxStakePercentage ? "text-warning" : undefined}>Stake é o dinheiro colocado nesta aposta. {(stakePercentage * 100).toFixed(1)}% da banca; limite {(rules.maxStakePercentage * 100).toFixed(1)}%.</FieldDescription></Field></div>
          <Field><FieldLabel htmlFor="bet-notes">Notas</FieldLabel><Textarea id="bet-notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Contexto, hipótese ou desvio de regra" /></Field>
          {confirmed ? <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Confirme: {draft.status === "pending" ? "o valor ficará exposto até o resultado" : `o resultado calculado será R$ ${calculateBetProfit(draft.status, draft.stake, draft.odds).toFixed(2)}`}.</div> : null}
        </FieldGroup>
      </div>
      <DrawerFooter>
        {bet ? <Button type="button" variant="destructive" size="icon" aria-label="Apagar aposta" onClick={remove}><IconTrash /></Button> : null}
        <DrawerClose asChild><Button type="button" variant="outline" className="flex-1">Cancelar</Button></DrawerClose>
        <Button type="button" className="flex-1" disabled={invalid} onClick={save}><IconCheck data-icon="inline-start" />{confirmed ? "Confirmar" : "Revisar"}</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>;
}
