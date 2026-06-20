export interface ProjectionInput {
  initialBankroll: number;
  targetBankroll: number;
  expectedReturnPerCycle: number;
  cyclesPerWeek: number;
  startDate: string;
}

export interface ProjectionScenario {
  name: "Conservador" | "Base" | "Agressivo";
  rate: number;
  cycles: number;
  estimatedDate?: string;
  series: { cycle: number; bankroll: number }[];
}

export function buildProjection(input: ProjectionInput): ProjectionScenario[] {
  return [
    scenario("Conservador", input, input.expectedReturnPerCycle * 0.6),
    scenario("Base", input, input.expectedReturnPerCycle),
    scenario("Agressivo", input, input.expectedReturnPerCycle * 1.35)
  ];
}

function scenario(name: ProjectionScenario["name"], input: ProjectionInput, rate: number): ProjectionScenario {
  const cycles = input.initialBankroll > 0 && input.targetBankroll > input.initialBankroll && rate > 0
    ? Math.ceil(Math.log(input.targetBankroll / input.initialBankroll) / Math.log(1 + rate))
    : 0;
  const safeCycles = Math.min(cycles, 1000);
  const series = Array.from({ length: safeCycles + 1 }, (_, cycle) => ({
    cycle,
    bankroll: input.initialBankroll * (1 + rate) ** cycle
  }));
  const estimatedDate = input.cyclesPerWeek > 0 ? new Date(new Date(input.startDate).getTime() + (cycles / input.cyclesPerWeek) * 7 * 86_400_000).toISOString() : undefined;
  return { name, rate, cycles, estimatedDate, series };
}
