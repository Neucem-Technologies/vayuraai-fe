import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import {
  INGESTION_STEP_LABELS,
  INGESTION_STEP_ORDER,
} from "@vayura/api-contracts/ingestion-events";
import type { IngestionStepKind } from "@vayura/api-contracts/common";
import { cn } from "@/lib/utils";

type Props = {
  currentStep?: IngestionStepKind;
  completedSteps: IngestionStepKind[];
  isActive: boolean;
};

export function PipelineProgress({ currentStep, completedSteps, isActive }: Props) {
  if (!isActive) return null;

  const completed = new Set(completedSteps);

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Processing pipeline
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {INGESTION_STEP_ORDER.map((step) => {
          const done = completed.has(step);
          const running = currentStep === step && !done;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                done && "border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/30",
                running && "border-primary/40 bg-primary/5",
                !done && !running && "border-border bg-background/60 text-muted-foreground",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : running ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 opacity-40" />
              )}
              <span className={cn(done || running ? "text-foreground" : undefined)}>
                {INGESTION_STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
