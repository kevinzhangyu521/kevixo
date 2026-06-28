import {
  Children,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  asChild?: boolean;
};

export function Button({
  asChild = false,
  className,
  children,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary"
      ? "bg-primary text-slate-950 hover:bg-sky-300"
      : "border border-slate-700 bg-slate-950/40 text-slate-100 hover:border-slate-500",
    className,
  );

  if (asChild) {
    const child = Children.only(children);

    if (isValidElement(child)) {
      const childElement = child as ReactElement<{ className?: string }>;

      return cloneElement(childElement, {
        className: cn(classes, childElement.props.className),
      });
    }
  }

  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
