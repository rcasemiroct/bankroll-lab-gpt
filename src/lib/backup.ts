import { db } from "@/db";
import type { BackupPayload, Bet, BetStatus, Snapshot } from "@/types";

export const SCHEMA_VERSION = 1;
export const APP_VERSION = "0.1.0";

export interface BackupMetadata {
  id: string;
  createdAt: string;
  size: number;
}

export interface BackupProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  authenticate?(): Promise<void>;
  backup(data: BackupPayload): Promise<BackupMetadata>;
  restore(backupId: string): Promise<BackupPayload>;
  listBackups(): Promise<BackupMetadata[]>;
}

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [bets, bankrollMovements, rules, settings, alertPreferences, simulationSettings, monthlyReports] = await Promise.all([
    db.bets.toArray(), db.movements.toArray(), db.rules.toArray(), db.settings.toArray(), db.alertPreferences.toArray(), db.simulationSettings.toArray(), db.monthlyReports.toArray()
  ]);
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    bets,
    bankrollMovements,
    rules,
    settings,
    alertPreferences,
    simulationSettings,
    monthlyReports,
    metadata: { source: "bankroll-lab", recordCount: bets.length + bankrollMovements.length }
  };
}

export function validateBackup(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BackupPayload>;
  return candidate.schemaVersion === SCHEMA_VERSION
    && candidate.metadata?.source === "bankroll-lab"
    && Array.isArray(candidate.bets)
    && Array.isArray(candidate.bankrollMovements)
    && Array.isArray(candidate.rules)
    && Array.isArray(candidate.settings)
    && candidate.bets.every((bet) => isSupportedBetStatus((bet as Partial<Bet>).status));
}

const statusAliases: Record<string, BetStatus> = {
  pending: "pending",
  open: "pending",
  win: "win",
  won: "win",
  loss: "loss",
  lost: "loss",
  void: "void",
  canceled: "void",
  cancelled: "void",
  refunded: "void"
};

function isSupportedBetStatus(status: unknown) {
  return typeof status === "string" && status.toLowerCase() in statusAliases;
}

export function normalizeBackupPayload(payload: BackupPayload): BackupPayload {
  return {
    ...payload,
    bets: payload.bets.map((bet) => {
      const status = statusAliases[String(bet.status).toLowerCase()];
      if (!status) throw new Error(`Status incompatível na aposta ${bet.id}.`);
      if (status === bet.status) return bet;
      return {
        ...bet,
        status,
        profit: status === "pending" || status === "void" ? 0 : bet.profit,
        returnAmount: status === "pending" ? 0 : status === "void" ? bet.stake : bet.returnAmount
      };
    })
  };
}

export async function createSnapshot(reason: Snapshot["reason"]) {
  const data = await buildBackupPayload();
  const serialized = JSON.stringify(data);
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    data,
    size: new Blob([serialized]).size,
    checksum: checksum(serialized),
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION
  };
  await db.snapshots.add(snapshot);
  await db.settings.update("default", { lastSnapshotAt: snapshot.createdAt, updatedAt: snapshot.createdAt });
  await pruneSnapshots();
  return snapshot;
}

export async function restorePayload(payload: BackupPayload, mode: "replace" | "merge") {
  if (!validateBackup(payload)) throw new Error("Arquivo incompatível ou incompleto.");
  const normalized = normalizeBackupPayload(payload);
  await createSnapshot("before_import");
  await db.transaction("rw", [db.bets, db.movements, db.rules, db.settings, db.alertPreferences, db.simulationSettings, db.monthlyReports], async () => {
    if (mode === "replace") {
      await Promise.all([db.bets.clear(), db.movements.clear(), db.rules.clear(), db.settings.clear(), db.alertPreferences.clear(), db.simulationSettings.clear(), db.monthlyReports.clear()]);
    }
    await Promise.all([
      db.bets.bulkPut(normalized.bets), db.movements.bulkPut(normalized.bankrollMovements), db.rules.bulkPut(normalized.rules), db.settings.bulkPut(normalized.settings),
      db.alertPreferences.bulkPut(normalized.alertPreferences ?? []), db.simulationSettings.bulkPut(normalized.simulationSettings ?? []), db.monthlyReports.bulkPut(normalized.monthlyReports ?? [])
    ]);
  });
}

export class LocalExportBackupProvider implements BackupProvider {
  name = "Arquivo local";
  async isAvailable() { return true; }
  async backup(data: BackupPayload) {
    const text = JSON.stringify(data, null, 2);
    const filename = `bankroll-lab-backup-${fileTimestamp()}.json`;
    const file = new File([text], filename, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Backup do Bankroll Lab" });
    else downloadBlob(file, filename);
    await db.settings.update("default", { lastExportedAt: data.exportedAt, betsAtLastExport: data.bets.length, updatedAt: data.exportedAt });
    return { id: filename, createdAt: data.exportedAt, size: file.size };
  }
  async restore(_backupId: string): Promise<BackupPayload> { throw new Error("Selecione o arquivo de backup no dispositivo."); }
  async listBackups() { return []; }
}

export class LocalSnapshotBackupProvider implements BackupProvider {
  name = "Snapshots locais";
  async isAvailable() { return true; }
  async backup() {
    const snapshot = await createSnapshot("manual");
    return { id: snapshot.id, createdAt: snapshot.createdAt, size: snapshot.size };
  }
  async restore(backupId: string) {
    const snapshot = await db.snapshots.get(backupId);
    if (!snapshot) throw new Error("Snapshot não encontrado.");
    return snapshot.data;
  }
  async listBackups() {
    return (await db.snapshots.orderBy("createdAt").reverse().toArray()).map(({ id, createdAt, size }) => ({ id, createdAt, size }));
  }
}

export async function exportCsv(kind: "bets" | "movements") {
  const rows = kind === "bets" ? await db.bets.toArray() : await db.movements.toArray();
  if (!rows.length) throw new Error("Não há dados para exportar.");
  const keys = Object.keys(rows[0]) as string[];
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => quoteCsv((row as unknown as Record<string, unknown>)[key])).join(","))].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `bankroll-lab-${kind}-${fileTimestamp()}.csv`);
}

async function pruneSnapshots() {
  const snapshots = await db.snapshots.orderBy("createdAt").reverse().toArray();
  const now = Date.now();
  const removable = snapshots.filter((snapshot) => {
    if (snapshot.reason === "before_import" || snapshot.reason === "before_reset") return false;
    const age = now - new Date(snapshot.createdAt).getTime();
    if (snapshot.reason === "weekly") return age > 365 * 86_400_000;
    return age > 14 * 86_400_000;
  });
  await db.snapshots.bulkDelete(removable.map((snapshot) => snapshot.id));
}

function checksum(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  return Math.abs(hash).toString(16);
}

function fileTimestamp() {
  return new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
}

function quoteCsv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// TODO: encryptBackup(data, password)
// TODO: decryptBackup(file, password)
