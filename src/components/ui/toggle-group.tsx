import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";
export function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) { return <ToggleGroupPrimitive.Root className={cn("inline-flex rounded-md border bg-secondary p-1", className)} {...props} />; }
export function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) { return <ToggleGroupPrimitive.Item className={cn("min-h-9 rounded-sm px-3 text-xs font-medium text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-foreground", className)} {...props} />; }
