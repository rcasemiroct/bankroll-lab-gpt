import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;
export function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) { return <DrawerPrimitive.Portal><DrawerPrimitive.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" /><DrawerPrimitive.Content className={cn("fixed inset-x-0 bottom-0 mt-24 flex max-h-[92vh] flex-col rounded-t-2xl border bg-popover outline-none", className)} {...props}><div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/40" />{children}</DrawerPrimitive.Content></DrawerPrimitive.Portal>; }
export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col gap-1 px-5 pb-3 pt-4", className)} {...props} />; }
export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) { return <DrawerPrimitive.Title className={cn("text-xl font-semibold", className)} {...props} />; }
export function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) { return <DrawerPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />; }
export function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex gap-2 border-t p-4 safe-bottom", className)} {...props} />; }
