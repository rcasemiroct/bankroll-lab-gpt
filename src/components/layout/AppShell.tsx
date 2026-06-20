import type { ComponentType } from "react";
import { IconAdjustmentsHorizontal, IconChartHistogram, IconClipboardList, IconHome, IconRoute } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type AppTab = "today" | "bets" | "projection" | "simulation" | "rules";

const items: Array<{ id: AppTab; label: string; icon: ComponentType<{ className?: string; stroke?: number }> }> = [
  { id: "today", label: "Hoje", icon: IconHome },
  { id: "bets", label: "Apostas", icon: IconClipboardList },
  { id: "projection", label: "Projeção", icon: IconRoute },
  { id: "simulation", label: "Simulação", icon: IconChartHistogram },
  { id: "rules", label: "Regras", icon: IconAdjustmentsHorizontal }
];

export function AppShell({ active, onNavigate, children }: { active: AppTab; onNavigate: (tab: AppTab) => void; children: React.ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-[1120px] bg-background md:border-x">
    <main className="mx-auto min-h-dvh w-full max-w-[780px] px-4 pb-28 safe-top md:px-6">{children}</main>
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur-xl safe-bottom">
      <div className="mx-auto grid max-w-[780px] grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return <button key={item.id} type="button" aria-current={selected ? "page" : undefined} onClick={() => onNavigate(item.id)} className={cn("relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground transition-colors", selected && "text-primary")}>
            {selected ? <span className="absolute inset-x-2 top-0 h-0.5 bg-primary" /> : null}
            <Icon className="size-6" stroke={1.7} />
            <span>{item.label}</span>
          </button>;
        })}
      </div>
    </nav>
  </div>;
}
