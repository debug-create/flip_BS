import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Panel({
  title, subtitle, action, children, className = "", icon: Icon, code,
}: {
  title?: string; subtitle?: string; action?: ReactNode; children: ReactNode;
  className?: string; icon?: LucideIcon; code?: string;
}) {
  return (
    <section className={`panel flex flex-col ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground truncate">{title}</h3>
                {code && <span className="mono text-[9px] text-muted-foreground/80 tracking-widest">{code}</span>}
              </div>
              {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}

export function StatCard({
  label, value, unit, delta, deltaTone = "success", icon: Icon, accent = "primary",
}: {
  label: string; value: string | number; unit?: string;
  delta?: string; deltaTone?: "success" | "danger" | "warning";
  icon?: LucideIcon; accent?: "primary" | "danger" | "success" | "warning";
}) {
  const accentMap = {
    primary: "from-primary/25 to-transparent text-primary",
    danger: "from-destructive/25 to-transparent text-destructive",
    success: "from-success/25 to-transparent text-success",
    warning: "from-warning/25 to-transparent text-warning",
  }[accent];
  const toneMap = {
    success: "text-success bg-success/10",
    danger: "text-destructive bg-destructive/10",
    warning: "text-warning bg-warning/10",
  }[deltaTone];

  return (
    <div className="panel relative overflow-hidden p-4">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-radial ${accentMap} blur-2xl opacity-50`} style={{ background: `radial-gradient(closest-side, currentColor, transparent)` }} />
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        {Icon && <Icon className={`h-4 w-4 ${accentMap.split(" ").pop()}`} />}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="mono text-[28px] font-semibold leading-none text-foreground tabular-nums">{value}</div>
        {unit && <div className="text-xs font-medium text-muted-foreground">{unit}</div>}
      </div>
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${toneMap}`}>
          {delta}
        </div>
      )}
    </div>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Critical: "text-destructive bg-destructive/15 border-destructive/40",
    High: "text-destructive bg-destructive/10 border-destructive/30",
    Medium: "text-warning bg-warning/10 border-warning/30",
    Low: "text-success bg-success/10 border-success/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 mono text-[10px] font-semibold uppercase tracking-wider ${map[level] ?? "text-muted-foreground border-border"}`}>
      <span className="status-dot bg-current" /> {level}
    </span>
  );
}

export function PageHeader({
  eyebrow, title, description, actions,
}: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
