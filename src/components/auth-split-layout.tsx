import type { ReactNode } from "react";
import { Link } from "wouter";
import { Briefcase, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignupAudience = "consultant" | "sme";

type AuthSplitLayoutProps = {
  children: ReactNode;
  /** Highlights the matching card on the sign-up screen. */
  audience?: SignupAudience;
  /** When set, the two cards switch the form instead of leaving the page. */
  onChooseAudience?: (audience: SignupAudience) => void;
};

const AUDIENCES: Array<{
  id: SignupAudience;
  title: string;
  body: string;
  action: string;
  icon: typeof Briefcase;
}> = [
  {
    id: "consultant",
    title: "A consulting firm",
    body: "Inventories and reports for each client, in one workspace.",
    action: "Open a practice",
    icon: Briefcase,
  },
  {
    id: "sme",
    title: "One company",
    body: "Upload bills, check the lines, and keep a Scope 1, 2, and 3 record.",
    action: "Start your inventory",
    icon: Building2,
  },
];

const PATH = ["Upload a bill", "Review the lines", "Prepare the report"];
const STANDARDS = ["GHG Protocol", "BRSR", "GRI", "CEA grid factor"];

function AudienceCard({
  title,
  body,
  action,
  icon: Icon,
  active,
  href,
  onClick,
}: {
  title: string;
  body: string;
  action: string;
  icon: typeof Briefcase;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "rounded-lg border bg-background/80 p-4 text-left transition-colors hover:border-primary/50",
    active && "border-primary bg-background",
  );
  const inner = (
    <>
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <div className="text-sm font-medium text-foreground">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      <div className="mt-3 text-xs font-medium text-primary">{action}</div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href ?? "/signup"} className={className}>
      {inner}
    </Link>
  );
}

/**
 * Split shell for login and sign-up. The side panel is the two ways in,
 * plus the three-step path and the standards the reports use.
 */
export function AuthSplitLayout({ children, audience, onChooseAudience }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[400px]">{children}</div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1 bg-muted">
        <div className="absolute inset-0 h-full w-full bg-primary/5 flex flex-col items-center justify-center p-12">
          <div className="max-w-md space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                Carbon accounting for a firm, or for one company
              </h3>
              <p className="text-muted-foreground">
                Bills go in. A person checks each line. The report comes out as a GHG inventory, BRSR, or GRI.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AUDIENCES.map((item) => (
                <AudienceCard
                  key={item.id}
                  title={item.title}
                  body={item.body}
                  action={item.action}
                  icon={item.icon}
                  active={audience === item.id}
                  onClick={onChooseAudience ? () => onChooseAudience(item.id) : undefined}
                  href={`/signup?as=${item.id}`}
                />
              ))}
            </div>
            <ol className="flex justify-between gap-3 text-left">
              {PATH.map((label, index) => (
                <li key={label} className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-primary">0{index + 1}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                </li>
              ))}
            </ol>
            <p className="text-center text-xs text-muted-foreground">{STANDARDS.join("  ·  ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
