import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: { default: "bg-foreground text-background", outline: "border border-border bg-transparent text-foreground" } }, defaultVariants: { variant: "default" } },
);
type Props = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;
export function Button({ className, variant, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonVariants({ variant, className }))} {...props} />;
}
