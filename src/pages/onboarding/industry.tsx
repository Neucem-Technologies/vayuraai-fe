import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding-shell";
import { Button } from "@/components/ui/button";
import { INDUSTRIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function OnboardingIndustry() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<string[]>(["it-ites", "manufacturing", "pharma"]);

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));
  };

  return (
    <OnboardingShell
      step={2}
      title="Which industries does your firm serve?"
      subtitle="Pick every sector your team has expertise in. We'll prioritize the right factor library and sample disclosures so each new client onboards faster."
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {INDUSTRIES.map((ind) => {
          const isSelected = selected.includes(ind.id);
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => toggle(ind.id)}
              data-testid={`industry-${ind.id}`}
              className={cn(
                "text-left p-4 rounded-lg border bg-card transition-all hover-elevate",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{ind.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-snug">{ind.desc}</div>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary border-primary" : "border-border bg-background",
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-8 mt-2 border-t">
        <Button variant="outline" onClick={() => setLocation("/onboarding/organization")} data-testid="button-back">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={() => setLocation("/onboarding/data-sources")}
          disabled={selected.length === 0}
          data-testid="button-continue"
        >
          Continue ({selected.length} selected)
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </OnboardingShell>
  );
}
