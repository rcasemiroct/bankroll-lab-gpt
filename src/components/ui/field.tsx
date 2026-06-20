import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col gap-4", className)} {...props} />; }
export function Field({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & { orientation?: "vertical" | "horizontal" }) { return <div role="group" className={cn("flex gap-2", orientation === "vertical" ? "flex-col" : "items-center justify-between", className)} {...props} />; }
export function FieldLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) { return <LabelPrimitive.Root className={cn("text-sm font-medium text-secondary-foreground", className)} {...props} />; }
export function FieldDescription({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("m-0 text-xs leading-relaxed text-muted-foreground", className)} {...props} />; }
export function FieldError({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("m-0 text-xs text-destructive", className)} {...props} />; }
export function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) { return <fieldset className={cn("flex flex-col gap-3 border-0 p-0", className)} {...props} />; }
export function FieldLegend({ className, ...props }: React.ComponentProps<"legend">) { return <legend className={cn("mb-2 text-sm font-semibold text-foreground", className)} {...props} />; }
