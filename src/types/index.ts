export type BetStatus = "pending" | "win" | "loss" | "void";
export type MovementType = "deposit" | "withdrawal" | "bonus" | "adjustment";
export type StakeMode = "fixed" | "percentage";
export type AlertSeverity = "low" | "medium" | "high";

export interface Bet {
  id: string;
  date: string;
  sportsbook: string;
  event: string;
  market: string;
  strategy: string;
  odds: number;
  stake: number;
  status: BetStatus;
  returnAmount: number;
  profit: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankrollMovement {
  id: string;
  date: string;
  type: MovementType;
  amount: number;
  notes: string;
  createdAt: string;
}

export interface Rules {
  id: "default";
  maxStakePercentage: number;
  strongAlertPercentage: number;
  dailyStopPercentage: number;
  weeklyStopPercentage: number;
  partialWithdrawalTarget: number;
  finalTarget: number;
  pauseAfterLosses: number;
  pauseAfterStop: boolean;
  minimumStrategyBets: number;
  withdrawalPercentage: number;
}

export interface Settings {
  id: "default";
  onboardingComplete: boolean;
  alertProfile: "conservative" | "moderate" | "custom";
  initialBankroll: number;
  startDate: string;
  lastExportedAt?: string;
  betsAtLastExport: number;
  lastSnapshotAt?: string;
  theme: "dark" | "light";
  updatedAt: string;
}

export interface SimulationSettings {
  id: "default";
  initialBankroll: number;
  targetBankroll: number;
  stopBankroll: number;
  averageOdds: number;
  winProbability: number;
  stakeMode: StakeMode;
  fixedStake: number;
  stakePercentage: number;
  maxStake: number;
  numberOfBets: number;
  numberOfSimulations: number;
}

export interface Snapshot {
  id: string;
  createdAt: string;
  reason: "daily" | "weekly" | "before_import" | "before_reset" | "after_10_bets" | "withdrawal_milestone" | "manual";
  data: BackupPayload;
  size: number;
  checksum: string;
  appVersion: string;
  schemaVersion: number;
}

export interface MonthlyReport {
  id: string;
  month: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertPreference {
  id: string;
  enabled: boolean;
}

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  bets: Bet[];
  bankrollMovements: BankrollMovement[];
  rules: Rules[];
  settings: Settings[];
  alertPreferences: AlertPreference[];
  simulationSettings: SimulationSettings[];
  monthlyReports: MonthlyReport[];
  metadata: { source: "bankroll-lab"; recordCount: number };
}

export interface RiskAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  category: "gain" | "loss" | "discipline" | "statistical" | "backup";
}
