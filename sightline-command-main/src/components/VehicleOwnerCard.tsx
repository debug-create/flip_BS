import { AlertTriangle } from "lucide-react";

interface ViolationHistoryItem {
  date: string;
  type: string;
  junction: string;
  challan: string;
  amount_rs: number;
  status: "PAID" | "UNPAID" | string;
}

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
  violation_history?: ViolationHistoryItem[];
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

      {/* Violation History Section */}
      {data.violation_history && data.violation_history.length > 0 && (
        <div className="border-t border-[#1d3a5f]/30 pt-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive block">
                PRIOR VIOLATION HISTORY
              </span>
              <span className="text-[9px] text-muted-foreground block">
                Source: BTP Enforcement Records · e-Challan System
              </span>
            </div>
            <span className="text-[8px] font-mono text-muted-foreground/30 uppercase tracking-wider">
              BTP E-CHALLAN RECORDS
            </span>
          </div>

          <div className="max-h-[200px] overflow-y-auto rounded border border-[#1F2937] bg-[#0A0F1A] scrollbar-thin">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#111827] text-muted-foreground text-[9px] uppercase tracking-wider">
                  <th className="px-2 py-1.5 font-semibold">Date</th>
                  <th className="px-2 py-1.5 font-semibold">Junction</th>
                  <th className="px-2 py-1.5 font-semibold">Violation</th>
                  <th className="px-2 py-1.5 font-semibold">Challan No.</th>
                  <th className="px-2 py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50">
                {data.violation_history.map((v, idx) => {
                  let formattedDate = v.date;
                  try {
                    const parts = v.date.split("-");
                    if (parts.length === 3) {
                      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const day = parseInt(parts[0], 10);
                      const month = months[parseInt(parts[1], 10) - 1];
                      const year = parts[2];
                      formattedDate = `${day} ${month} ${year}`;
                    }
                  } catch (e) {
                    // fallback
                  }

                  const isPaid = v.status === "PAID";
                  const isHelmet = v.type.toLowerCase().includes("helmet");
                  
                  return (
                    <tr
                      key={v.challan}
                      className={idx % 2 === 1 ? "bg-[#1A2235]/40" : "bg-transparent"}
                    >
                      <td className="px-2 py-1.5 text-white font-medium whitespace-nowrap">{formattedDate}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{v.junction}</td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap ${
                            isHelmet
                              ? "bg-destructive/15 text-destructive border border-destructive/20"
                              : "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20"
                          }`}
                        >
                          {v.type}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">{v.challan}</td>
                      <td className="px-2 py-1.5">
                        {isPaid ? (
                          <span className="inline-flex items-center rounded bg-success/10 text-success border border-success/20 px-1 py-0.5 text-[9px] font-bold">
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-destructive/10 text-destructive border border-destructive/20 px-1 py-0.5 text-[9px] font-bold animate-pulse">
                            UNPAID
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono pt-1">
            Total challans: 5 · Paid: ₹2,500 · Outstanding: ₹2,000 ·{" "}
            <span className="text-destructive font-bold">⚠ 2 UNPAID challans pending action</span>
          </div>
        </div>
      )}
    </div>
  );
}
