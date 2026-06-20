import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn("h-12 w-full rounded-md border bg-secondary px-3 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 aria-invalid:border-destructive", className)} {...props} />;
}
