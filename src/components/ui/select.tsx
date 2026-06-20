import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) { return <SelectPrimitive.Trigger className={cn("flex h-12 w-full items-center justify-between rounded-md border bg-secondary px-3 text-left text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20", className)} {...props}>{children}<SelectPrimitive.Icon><IconChevronDown className="size-4 text-muted-foreground" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>; }
export function SelectContent({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) { return <SelectPrimitive.Portal><SelectPrimitive.Content className={cn("max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border bg-popover shadow-xl", className)} position="popper" sideOffset={4} {...props}><SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>; }
export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) { return <SelectPrimitive.Item className={cn("relative flex min-h-11 cursor-default select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none focus:bg-accent", className)} {...props}><span className="absolute left-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><IconCheck className="size-4" /></SelectPrimitive.ItemIndicator></span><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText></SelectPrimitive.Item>; }
