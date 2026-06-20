import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("min-h-24 w-full resize-none rounded-md border bg-secondary p-3 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20", className)} {...props} />;
}
