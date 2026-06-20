import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short"
});
