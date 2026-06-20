import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) { return <section className={cn("rounded-lg border bg-card text-card-foreground shadow-[0_16px_40px_rgba(0,0,0,.12)]", className)} {...props} />; }
export function CardHeader({ className, ...props }: React.ComponentProps<"header">) { return <header className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />; }
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) { return <h3 className={cn("text-sm font-semibold uppercase tracking-[.05em] text-muted-foreground", className)} {...props} />; }
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("m-0 text-sm leading-relaxed text-muted-foreground", className)} {...props} />; }
export function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("px-4 pb-4", className)} {...props} />; }
export function CardFooter({ className, ...props }: React.ComponentProps<"footer">) { return <footer className={cn("flex items-center gap-2 px-4 pb-4", className)} {...props} />; }
