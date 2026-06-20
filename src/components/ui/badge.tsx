import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const variants = cva("inline-flex items-center rounded-sm border px-2 py-1 text-xs font-semibold", { variants: { variant: { default: "border-primary/30 bg-primary/10 text-primary", secondary: "border-border bg-secondary text-secondary-foreground", positive: "border-positive/30 bg-positive/10 text-positive", warning: "border-warning/30 bg-warning/10 text-warning", destructive: "border-destructive/30 bg-destructive/10 text-destructive" } }, defaultVariants: { variant: "default" } });
export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof variants>) { return <span className={cn(variants({ variant }), className)} {...props} />; }
