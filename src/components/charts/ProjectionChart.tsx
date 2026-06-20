import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProjectionScenario } from "@/lib/projections";
import { currency } from "@/lib/utils";
export function ProjectionChart({ scenarios }: { scenarios: ProjectionScenario[] }) {
  const length = Math.max(...scenarios.map((item) => item.series.length));
  const data = Array.from({ length }, (_, cycle) => ({ cycle, ...Object.fromEntries(scenarios.map((scenario) => [scenario.name, scenario.series[Math.min(cycle, scenario.series.length - 1)]?.bankroll])) }));
  const colors = ["#8aa5bc", "#5ec8ff", "#6fcf5d"];
  return <div className="h-64 w-full"><ResponsiveContainer minWidth={1} initialDimension={{ width: 320, height: 256 }}><LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><XAxis dataKey="cycle" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(value) => currency.format(Number(value))} />{scenarios.map((scenario, index) => <Line isAnimationActive={false} key={scenario.name} type="monotone" dataKey={scenario.name} stroke={colors[index]} strokeWidth={index === 1 ? 2.5 : 1.5} dot={false} />)}</LineChart></ResponsiveContainer></div>;
}
