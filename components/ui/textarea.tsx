import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-80 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-base leading-7 text-slate-100 placeholder:text-slate-500 transition focus:border-primary focus:ring-0",
        className,
      )}
      {...props}
    />
  );
}
