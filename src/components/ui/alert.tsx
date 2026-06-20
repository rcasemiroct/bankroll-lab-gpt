import * as React from "react";
import { cn } from "@/lib/utils";
export function Alert({ className, ...props }: React.ComponentProps<"div">) { return <div role="alert" className={cn("relative rounded-lg border bg-card p-4", className)} {...props} />; }
export function AlertTitle({ className, ...props }: React.ComponentProps<"h4">) { return <h4 className={cn("mb-1 font-semibold", className)} {...props} />; }
export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />; }
