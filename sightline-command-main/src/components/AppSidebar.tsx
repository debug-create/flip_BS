import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ScanSearch, FileSearch, BarChart3, Truck, Flame, ServerCog,
  ChevronLeft, ChevronRight, Siren,
} from "lucide-react";
import { ACTIVE_ALERTS_SUMMARY } from "@/lib/mockData";

const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, code: "CC-01" },
  { to: "/analyze", label: "Analyze", icon: ScanSearch, code: "AN-02" },
  { to: "/evidence", label: "Evidence Log", icon: FileSearch, code: "EV-03" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, code: "AT-04" },
  { to: "/fleet", label: "Fleet Intelligence", icon: Truck, code: "FL-05" },
  { to: "/hotspots", label: "Hotspot Prediction", icon: Flame, code: "HP-06" },
  { to: "/system", label: "System Status", icon: ServerCog, code: "SY-07" },
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={`relative z-10 flex h-full shrink-0 flex-col border-r border-border bg-surface/50 backdrop-blur-xl transition-[width] duration-300 ${
        collapsed ? "w-[68px]" : "w-[244px]"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3">
        {!collapsed && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Modules
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition hover:text-foreground hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition ${
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-[2px] rounded-r bg-primary shadow-[0_0_12px_var(--primary)]" />
              )}
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="mono text-[9px] tracking-widest text-muted-foreground/70">{item.code}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="m-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-destructive">
            <Siren className="h-3 w-3 animate-pulse" /> Active Alerts
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <div className="mono text-2xl font-semibold text-foreground tabular-nums">{ACTIVE_ALERTS_SUMMARY.active}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">live</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded border border-warning/30 bg-warning/10 px-1.5 py-1">
              <div className="mono text-sm font-semibold text-warning">{ACTIVE_ALERTS_SUMMARY.escalated}</div>
              <div className="uppercase tracking-wider text-muted-foreground">Escalated</div>
            </div>
            <div className="rounded border border-primary/30 bg-primary/10 px-1.5 py-1">
              <div className="mono text-sm font-semibold text-primary">{ACTIVE_ALERTS_SUMMARY.predicted}</div>
              <div className="uppercase tracking-wider text-muted-foreground">Predicted</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
