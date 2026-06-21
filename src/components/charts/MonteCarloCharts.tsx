import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonteCarloResult } from "@/lib/monteCarlo";
import { currency } from "@/lib/utils";

export function DistributionChart({ result }: { result: MonteCarloResult }) {
  return <div className="h-52" aria-label="Distribuição das bancas finais"><ResponsiveContainer minWidth={1} initialDimension={{ width: 320, height: 208 }}><BarChart data={result.distribution}><XAxis dataKey="range" tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} labelFormatter={(value) => `Faixa final R$ ${value}`} formatter={(value) => [Number(value), "Simulações"]} /><Bar isAnimationActive={false} dataKey="count" fill="var(--chart)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

export function PathsChart({ result }: { result: MonteCarloResult }) {
  const keys = Object.keys(result.paths[0] ?? {}).filter((key) => key !== "bet");
  return <div className="h-52" aria-label="Exemplos de caminhos simulados da banca"><ResponsiveContainer minWidth={1} initialDimension={{ width: 320, height: 208 }}><LineChart data={result.paths}><XAxis dataKey="bet" tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} labelFormatter={(value) => `Após ${value} apostas`} formatter={(value, name) => [currency.format(Number(value)), `Caminho ${String(name).replace("path", "")}`]} />{keys.map((key, index) => <Line isAnimationActive={false} key={key} type="monotone" dataKey={key} stroke={`hsl(${198 + index * 7} 80% ${62 - index * 3}%)`} strokeOpacity={0.5} strokeWidth={1.2} dot={false} />)}</LineChart></ResponsiveContainer></div>;
}
