import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
};

export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((kpi) => (
        <Card key={kpi.label} className="shadow-card">
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
            <CardDescription className="min-w-0">{kpi.label}</CardDescription>
            <span
              className={
                "grid size-9 shrink-0 place-items-center rounded-lg " +
                (kpi.tone === "warning"
                  ? "bg-gold-soft text-accent-foreground"
                  : kpi.tone === "success"
                    ? "bg-success/15 text-success"
                    : "bg-primary-soft text-primary")
              }
            >
              <kpi.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-extrabold tracking-tight break-words">
              {kpi.value}
            </p>
            <p
              className={
                "mt-1 flex items-center gap-1 text-xs " +
                (kpi.tone === "warning" ? "text-gold" : "text-muted-foreground")
              }
            >
              {kpi.tone === "default" || !kpi.tone ? (
                <ArrowUpRight className="size-3.5 shrink-0 text-success" />
              ) : null}
              {kpi.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
