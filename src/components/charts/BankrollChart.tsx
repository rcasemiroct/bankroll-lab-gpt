import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BankrollMovement, Bet } from "@/types";
import { buildBankrollSeries } from "@/lib/calculations";
import { currency, shortDate } from "@/lib/utils";

export function BankrollChart({ bets, movements }: { bets: Bet[]; movements: BankrollMovement[] }) {
  const data = buildBankrollSeries(bets, movements);
  return <div className="h-40 w-full" aria-label="Evolução da banca">
    <ResponsiveContainer width="100%" height="100%" minWidth={1} initialDimension={{ width: 320, height: 160 }}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs><linearGradient id="bankroll-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart)" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={(value) => shortDate.format(new Date(`${value}T12:00:00`))} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(value) => `${Math.round(value / 100) * 100}`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
        <Tooltip cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(value) => [currency.format(Number(value)), "Banca"]} labelFormatter={(label) => shortDate.format(new Date(`${label}T12:00:00`))} />
        <Area type="monotone" dataKey="bankroll" stroke="var(--chart)" strokeWidth={2.5} fill="url(#bankroll-fill)" dot={false} activeDot={{ r: 4, fill: "var(--chart)" }} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
