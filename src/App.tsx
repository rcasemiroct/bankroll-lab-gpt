import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import { AppShell, type AppTab } from "@/components/layout/AppShell";
import { useAppData } from "@/hooks/use-app-data";
import { createSnapshot } from "@/lib/backup";
import { Today } from "@/pages/Today";
import { Bets } from "@/pages/Bets";
import { Projection } from "@/pages/Projection";
import { Simulation } from "@/pages/Simulation";
import { Rules } from "@/pages/Rules";
import { Onboarding } from "@/components/onboarding/Onboarding";

export function App() {
  const data = useAppData();
  const [active, setActive] = useState<AppTab>("today");
  const snapshotChecked = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", data.settings.theme === "light");
  }, [data.settings.theme]);

  useEffect(() => {
    if (snapshotChecked.current || !data.settings.onboardingComplete) return;
    snapshotChecked.current = true;
    const last = data.settings.lastSnapshotAt ? new Date(data.settings.lastSnapshotAt).getTime() : 0;
    if (Date.now() - last > 86_400_000 && (data.bets.length || data.movements.length)) void createSnapshot("daily");
  }, [data.bets.length, data.movements.length, data.settings.lastSnapshotAt, data.settings.onboardingComplete]);

  if (!data.settings.onboardingComplete) return <><Onboarding /><Toaster theme="dark" position="top-center" richColors /></>;

  function navigate(tab: AppTab) {
    setActive(tab);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return <AppShell active={active} onNavigate={navigate}>
    {active === "today" ? <Today data={data} onOpenRules={() => navigate("rules")} /> : null}
    {active === "bets" ? <Bets data={data} /> : null}
    {active === "projection" ? <Projection data={data} /> : null}
    {active === "simulation" ? <Simulation data={data} /> : null}
    {active === "rules" ? <Rules data={data} /> : null}
    <Toaster theme={data.settings.theme} position="top-center" richColors />
  </AppShell>;
}
