"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface ReportRow {
  name: string;
  reg: string;
  status: string;
  totalKm: number;
  fuelEfficiency: string;
  totalFuelCost: string;
  totalMaintCost: string;
  totalCost: string;
  totalRevenue: string;
  roi: string;
}

export function CSVLink({ data }: { data: ReportRow[] }) {
  const handleExport = () => {
    const headers = ["Vehicle,Reg,Status,Total Km,km/L,Fuel Cost,Maint Cost,Total Cost,Revenue,ROI (%)"];
    const rows = data.map(r =>
      `${r.name},${r.reg},${r.status},${r.totalKm},${r.fuelEfficiency},${r.totalFuelCost},${r.totalMaintCost},${r.totalCost},${r.totalRevenue},${r.roi}`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transitops-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileDown className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  );
}
