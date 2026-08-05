import { Check } from "lucide-react";
import { workflowSteps } from "@/lib/casheva-data";
import { cn } from "@/lib/utils";

export function LoanStepper({
  stage,
  rejected = false,
}: {
  stage: number;
  rejected?: boolean;
}) {
  return (
    <ol className="flex min-w-full gap-2 overflow-x-auto pb-1">
      {workflowSteps.map((label, i) => {
        const idx = i + 1;
        const done = stage > idx;
        const active = stage === idx;
        return (
          <li key={label} className="flex min-w-[130px] flex-1 items-center gap-2">
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  rejected && active
                    ? "bg-destructive"
                    : done
                      ? "bg-success"
                      : active
                        ? "bg-gold"
                        : "bg-muted",
                )}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors",
                    done
                      ? "bg-success text-success-foreground"
                      : active
                        ? "bg-gold text-gold-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" /> : idx}
                </span>
                <span
                  className={cn(
                    "truncate text-[11px]",
                    active ? "font-semibold" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
