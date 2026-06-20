import { useRef, useState } from "react";
import { IconCloudDownload, IconDatabaseExport, IconFileImport, IconRestore, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import type { BackupPayload } from "@/types";
import type { ReturnTypeOfUseAppData } from "@/pages/page-types";
import { db } from "@/db";
import { buildBackupPayload, createSnapshot, exportCsv, LocalExportBackupProvider, restorePayload, validateBackup } from "@/lib/backup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { shortDate } from "@/lib/utils";

export function Backups({ data }: { data: ReturnTypeOfUseAppData }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BackupPayload>();
  const backupLate = !data.settings.lastExportedAt || Date.now() - new Date(data.settings.lastExportedAt).getTime() > 7 * 86_400_000;
  async function exportBackup() {
    const payload = await buildBackupPayload();
    await new LocalExportBackupProvider().backup(payload);
    toast.success("Backup gerado. Salve em Arquivos, iCloud Drive ou outro local seguro.");
  }
  async function readFile(file?: File) {
    if (!file) return;
    try {
      const candidate = JSON.parse(await file.text()) as unknown;
      if (!validateBackup(candidate)) throw new Error("Versão ou estrutura incompatível.");
      setPreview(candidate);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível ler o arquivo."); }
  }
  async function importData(mode: "replace" | "merge") {
    if (!preview) return;
    await restorePayload(preview, mode);
    setPreview(undefined);
    toast.success(mode === "replace" ? "Dados substituídos com snapshot de segurança." : "Dados mesclados com snapshot de segurança.");
  }
  async function restoreSnapshot(id: string) {
    const snapshot = await db.snapshots.get(id);
    if (!snapshot) return;
    await restorePayload(snapshot.data, "replace");
    toast.success("Snapshot restaurado.");
  }
  async function clearOldSnapshots() {
    const preserved = data.snapshots.filter((snapshot) => snapshot.reason === "before_import" || snapshot.reason === "before_reset").map((snapshot) => snapshot.id);
    await db.snapshots.filter((snapshot) => !preserved.includes(snapshot.id)).delete();
    toast.success("Snapshots recorrentes apagados. Proteções pré-importação foram mantidas.");
  }
  return <div className="flex flex-col gap-3"><Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Proteção do histórico</CardTitle><CardDescription>IndexedDB não substitui um arquivo externo</CardDescription></div><Badge variant={backupLate ? "warning" : "positive"}>{backupLate ? "Backup atrasado" : "Backup em dia"}</Badge></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2"><Button size="lg" onClick={exportBackup}><IconDatabaseExport data-icon="inline-start" />Exportar backup agora</Button><Button size="lg" variant="outline" onClick={() => inputRef.current?.click()}><IconFileImport data-icon="inline-start" />Importar backup</Button><Button variant="secondary" onClick={() => exportCsv("bets")}><IconCloudDownload data-icon="inline-start" />CSV de apostas</Button><Button variant="secondary" onClick={() => exportCsv("movements")}><IconCloudDownload data-icon="inline-start" />CSV de movimentos</Button><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={(event) => readFile(event.target.files?.[0])} /></CardContent></Card><Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Snapshots locais</CardTitle><CardDescription>{data.snapshots.length} pontos de recuperação neste dispositivo</CardDescription></div><Button variant="ghost" size="icon" aria-label="Criar snapshot manual" onClick={() => createSnapshot("manual").then(() => toast.success("Snapshot criado."))}><IconRestore /></Button></CardHeader><CardContent className="p-0">{data.snapshots.length ? data.snapshots.slice(0, 8).map((snapshot) => <div key={snapshot.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t px-4 py-3"><div><strong className="text-sm">{snapshotReason(snapshot.reason)}</strong><span className="mt-1 block text-xs text-muted-foreground">{shortDate.format(new Date(snapshot.createdAt))} • {(snapshot.size / 1024).toFixed(1)} KB • #{snapshot.checksum}</span></div><Button variant="outline" size="sm" onClick={() => restoreSnapshot(snapshot.id)}>Restaurar</Button></div>) : <div className="p-8 text-center text-sm text-muted-foreground">Nenhum snapshot criado.</div>}</CardContent>{data.snapshots.length ? <div className="border-t p-3"><Button variant="ghost" className="w-full text-destructive" onClick={clearOldSnapshots}><IconTrash data-icon="inline-start" />Apagar snapshots antigos</Button></div> : null}</Card><p className="px-1 text-xs leading-relaxed text-muted-foreground">Seu histórico é parte da análise. Exporte um backup para não perder a base estatística.</p><Drawer open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(undefined)}><DrawerContent><DrawerHeader><DrawerTitle>Revisar importação</DrawerTitle><DrawerDescription>Um snapshot local será criado automaticamente antes da mudança.</DrawerDescription></DrawerHeader>{preview ? <div className="grid grid-cols-3 gap-2 px-5 pb-5"><PreviewMetric label="Apostas" value={preview.bets.length} /><PreviewMetric label="Movimentos" value={preview.bankrollMovements.length} /><PreviewMetric label="Versão" value={preview.schemaVersion} /></div> : null}<DrawerFooter><Button variant="outline" className="flex-1" onClick={() => importData("merge")}>Mesclar</Button><Button className="flex-1" onClick={() => importData("replace")}>Substituir tudo</Button></DrawerFooter></DrawerContent></Drawer></div>;
}
function PreviewMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-md border bg-secondary p-3 text-center"><span className="block text-xs text-muted-foreground">{label}</span><strong className="tabular mt-1 block text-lg">{value}</strong></div>; }
function snapshotReason(reason: string) { return ({ daily: "Snapshot diário", weekly: "Snapshot semanal", before_import: "Antes de importação", before_reset: "Antes de reset", after_10_bets: "Após 10 apostas", withdrawal_milestone: "Retirada relevante", manual: "Snapshot manual" } as Record<string, string>)[reason] ?? reason; }
