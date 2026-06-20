import { useEffect, useState } from "react";
import { IconCheck, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { db } from "@/db";
import type { BankrollMovement, MovementType } from "@/types";
import { createSnapshot } from "@/lib/backup";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function MovementForm({ open, onOpenChange, activeBankroll, movement }: { open: boolean; onOpenChange: (open: boolean) => void; activeBankroll: number; movement?: BankrollMovement }) {
  const [type, setType] = useState<MovementType>(movement?.type ?? "deposit");
  const [date, setDate] = useState(movement?.date ?? new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(movement?.amount ?? 0);
  const [notes, setNotes] = useState(movement?.notes ?? "");
  useEffect(() => {
    setType(movement?.type ?? "deposit");
    setDate(movement?.date ?? new Date().toISOString().slice(0, 10));
    setAmount(movement?.amount ?? 0);
    setNotes(movement?.notes ?? "");
  }, [movement, open]);
  async function save() {
    if (amount <= 0) return;
    const createdAt = new Date().toISOString();
    await db.movements.put({ id: movement?.id ?? crypto.randomUUID(), date, type, amount, notes, createdAt: movement?.createdAt ?? createdAt });
    if (type === "withdrawal" && amount >= activeBankroll * 0.2) await createSnapshot("withdrawal_milestone");
    toast.success(movement ? "Movimento atualizado." : "Movimento registrado.");
    onOpenChange(false);
  }
  async function remove() {
    if (!movement) return;
    await db.movements.delete(movement.id);
    toast.success("Movimento apagado.");
    onOpenChange(false);
  }
  return <Drawer open={open} onOpenChange={onOpenChange}><DrawerContent><DrawerHeader><DrawerTitle>{movement ? "Editar movimento" : "Novo movimento"}</DrawerTitle><DrawerDescription>Depósitos, retiradas, bônus e ajustes ficam separados do resultado das apostas.</DrawerDescription></DrawerHeader><div className="overflow-y-auto px-5 pb-5"><FieldGroup><Field><FieldLabel>Tipo</FieldLabel><Select value={type} onValueChange={(value: MovementType) => setType(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="deposit">Depósito</SelectItem><SelectItem value="withdrawal">Retirada</SelectItem><SelectItem value="bonus">Bônus</SelectItem><SelectItem value="adjustment">Ajuste</SelectItem></SelectGroup></SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="movement-date">Data</FieldLabel><Input id="movement-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field><FieldLabel htmlFor="movement-amount">Valor</FieldLabel><Input id="movement-amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount || ""} onChange={(event) => setAmount(Number(event.target.value))} placeholder="R$ 0,00" /></Field></div><Field><FieldLabel htmlFor="movement-notes">Notas</FieldLabel><Textarea id="movement-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Origem ou motivo" /></Field></FieldGroup></div><DrawerFooter>{movement ? <Button variant="destructive" size="icon" aria-label="Apagar movimento" onClick={remove}><IconTrash /></Button> : null}<DrawerClose asChild><Button variant="outline" className="flex-1">Cancelar</Button></DrawerClose><Button className="flex-1" disabled={amount <= 0} onClick={save}><IconCheck data-icon="inline-start" />Salvar</Button></DrawerFooter></DrawerContent></Drawer>;
}
