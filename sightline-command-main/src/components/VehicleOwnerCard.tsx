import { AlertTriangle } from "lucide-react";

interface VehicleLookup {
  owner_name: string;
  address: string;
  vehicle_class: string;
  make: string;
  model: string;
  colour: string;
  fuel_type?: string;
  insurance_status: string;
  puc_status: string;
  prior_violations: number;
  repeat_offender: boolean;
  pending_challans: number;
  pending_amount_rs: number;
  rto_office: string;
  data_source?: string;
  lookup_status: string;
}

export function VehicleOwnerCard({
  data,
  compact = false,
}: {
  data: VehicleLookup | null | undefined;
  compact?: boolean;
}) {
  if (!data) return null;

  const insuranceValid = data.insurance_status === "VALID";
  const pucValid = data.puc_status === "VALID";
  const fuel = data.fuel_type || "Petrol";

  return (
    <div
      className={`rounded-lg border border-[#1D3A5F] bg-[#0c1220] p-4 text-xs shadow-md ${
        compact ? "space-y-2.5" : "space-y-3"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1d3a5f]/40 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6]">
          VEHICLE OWNER RECORD
        </span>
        <span className="text-[9px] text-muted-foreground">
          {data.data_source || "Vahan 4.0 · MoRTH"}
        </span>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-1">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
              OWNER
            </span>
            <span className="font-bold text-white text-[13px]">{data.owner_name}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
              ADDRESS
            </span>
            <span className="text-muted-foreground leading-snug">{data.address}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
              RTO
            </span>
            <span className="text-muted-foreground">{data.rto_office}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-1">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
              VEHICLE
            </span>
            <span className="font-medium text-white">{data.make} {data.model}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
              COLOUR
            </span>
            <span className="text-muted-foreground">{data.colour}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
              FUEL
            </span>
            <span className="text-muted-foreground">{fuel}</span>
          </div>
        </div>
      </div>

      {/* Full width row below: Badges and Pending Challans */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#1d3a5f]/30 pt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            INSURANCE:
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              insuranceValid
                ? "bg-success/10 text-success border border-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {data.insurance_status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            PUC:
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              pucValid
                ? "bg-success/10 text-success border border-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {data.puc_status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            PENDING CHALLANS:
          </span>
          <span
            className={`mono font-bold ${
              data.pending_challans > 0 ? "text-[#f59e0b]" : "text-muted-foreground"
            }`}
          >
            {data.pending_challans}
          </span>
        </div>
      </div>

      {/* Full width — PRIOR VIOLATIONS */}
      <div className="border-t border-[#1d3a5f]/30 pt-2.5">
        <div className="text-[11px] text-muted-foreground font-mono">
          {data.prior_violations} prior violation{data.prior_violations === 1 ? "" : "s"} recorded
        </div>
        {data.repeat_offender && (
          <div className="mt-2 flex items-center justify-center gap-2 rounded bg-destructive px-3 py-2 text-center text-xs font-bold tracking-wider text-white">
            <AlertTriangle className="h-4 w-4 text-white shrink-0" />
            <span>⚠ REPEAT OFFENDER — HIGH RISK VEHICLE</span>
          </div>
        )}
      </div>
    </div>
  );
}
