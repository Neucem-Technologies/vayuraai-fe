import type { ReactNode } from "react";
import { Cloud, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingShellProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const STEPS = [
  { id: 1, label: "Organization" },
  { id: 2, label: "Industry" },
  { id: 3, label: "Data sources" },
];

export function OnboardingShell({ step, title, subtitle, children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Cloud className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Vayura AI</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-6 pt-12 pb-16 flex-1">
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, idx) => {
            const isComplete = s.id < step;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors shrink-0",
                      isComplete && "bg-primary text-primary-foreground border-primary",
                      isCurrent && "bg-primary/10 text-primary border-primary",
                      !isComplete && !isCurrent && "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      (isCurrent || isComplete) ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border mx-3 sm:mx-6" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
