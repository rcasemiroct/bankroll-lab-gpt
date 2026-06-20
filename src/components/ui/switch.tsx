import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) { return <SwitchPrimitive.Root className={cn("inline-flex h-6 w-11 items-center rounded-full border bg-secondary transition data-[state=checked]:bg-primary", className)} {...props}><SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-foreground transition data-[state=checked]:translate-x-5" /></SwitchPrimitive.Root>; }
