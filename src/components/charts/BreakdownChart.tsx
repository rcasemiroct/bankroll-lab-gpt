import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency } from "@/lib/utils";

export interface BreakdownDatum { name: string; value: number; }

export function BreakdownChart({ data, valueType = "currency" }: { data: BreakdownDatum[]; valueType?: "currency" | "percent" }) {
  const format = (value: number) => valueType === "currency" ? currency.format(value) : `${value.toFixed(1)}%`;
  return <div className="h-52 w-full"><ResponsiveContainer minWidth={1} initialDimension={{ width: 320, height: 208 }}><BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}><CartesianGrid horizontal={false} stroke="var(--border)" /><XAxis type="number" tickFormatter={(value) => valueType === "currency" ? `${Math.round(Number(value))}` : `${Number(value).toFixed(0)}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={82} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(value) => format(Number(value))} /><Bar dataKey="value" isAnimationActive={false} radius={[0, 4, 4, 0]}>{data.map((item) => <Cell key={item.name} fill={item.value >= 0 ? "var(--positive)" : "var(--destructive)"} />)}</Bar></BarChart></ResponsiveContainer></div>;
}
