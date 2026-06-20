import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
export const Tabs = TabsPrimitive.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) { return <TabsPrimitive.List className={cn("inline-flex rounded-md border bg-secondary p-1", className)} {...props} />; }
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) { return <TabsPrimitive.Trigger className={cn("min-h-9 rounded-sm px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground", className)} {...props} />; }
export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) { return <TabsPrimitive.Content className={cn("outline-none", className)} {...props} />; }
