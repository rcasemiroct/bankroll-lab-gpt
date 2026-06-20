import { useEffect, useState } from "react";
import { IconChevronRight, IconMoon, IconSun, IconTransfer } from "@tabler/icons-react";
import type { BankrollMovement } from "@/types";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { db } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MovementForm } from "@/components/forms/MovementForm";
import { currency, shortDate } from "@/lib/utils";

export function Settings({ data }: { data: ReturnTypeOfUseAppData }) {
  const dark = data.settings.theme === "dark";
  const [movementOpen, setMovementOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<BankrollMovement>();
  useEffect(() => { document.documentElement.classList.toggle("light", !dark); }, [dark]);
  async function changeTheme(checked: boolean) { await db.settings.update("default", { theme: checked ? "dark" : "light", updatedAt: new Date().toISOString() }); }
  function editMovement(movement?: BankrollMovement) { setSelectedMovement(movement); setMovementOpen(true); }
  return <><Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Movimentos de banca</CardTitle><CardDescription>Depósitos, retiradas, bônus e ajustes</CardDescription></div><Button variant="ghost" size="icon" aria-label="Novo movimento" onClick={() => editMovement()}><IconTransfer /></Button></CardHeader><CardContent className="p-0">{data.movements.slice(0, 8).map((movement) => <button key={movement.id} type="button" onClick={() => editMovement(movement)} className="grid min-h-14 w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-t px-4 py-3 text-left"><span><strong className="block text-sm">{movementLabel(movement.type)}</strong><span className="mt-0.5 block text-xs text-muted-foreground">{shortDate.format(new Date(`${movement.date}T12:00:00`))} • {movement.notes || "Sem notas"}</span></span><strong className={movement.type === "withdrawal" ? "tabular text-destructive" : "tabular text-positive"}>{movement.type === "withdrawal" ? "−" : "+"}{currency.format(movement.amount)}</strong><IconChevronRight className="size-4 text-muted-foreground" /></button>)}</CardContent></Card><Card><CardHeader><CardTitle>Aparência e privacidade</CardTitle><CardDescription>Nenhuma informação sai deste dispositivo</CardDescription></CardHeader><CardContent><Field orientation="horizontal"><div className="flex items-center gap-3">{dark ? <IconMoon className="text-primary" /> : <IconSun className="text-warning" />}<div><FieldLabel htmlFor="dark-mode">Modo escuro</FieldLabel><FieldDescription>O modo claro usa o mesmo sistema semântico.</FieldDescription></div></div><Switch id="dark-mode" checked={dark} onCheckedChange={changeTheme} /></Field></CardContent></Card><MovementForm open={movementOpen} onOpenChange={setMovementOpen} activeBankroll={data.metrics.activeBankroll} movement={selectedMovement} /></>;
}

function movementLabel(type: BankrollMovement["type"]) { return { deposit: "Depósito", withdrawal: "Retirada", bonus: "Bônus", adjustment: "Ajuste" }[type]; }
