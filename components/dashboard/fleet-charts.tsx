"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, Area, AreaChart,
  BarChart, Bar, ReferenceLine,
} from "recharts";

const STATUS_COLORS = ["#22c55e", "#3b82f6", "#d97706", "#f87171"];

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.payload.color }} />
        <span className="font-semibold">{p.name}</span>
      </div>
      <p className="text-muted-foreground">{p.value} vehicles</p>
    </div>
  );
}

function LineTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-lg border bg-card px-4 py-3 text-sm shadow-lg min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}</span>
          </div>
          <span className="font-medium text-foreground">${p.value.toLocaleString()}</span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex items-center justify-between font-semibold text-foreground">
        <span>Total</span>
        <span>${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const rating = val >= 10 ? "Excellent" : val >= 7 ? "Good" : val >= 4 ? "Average" : "Poor";
  const color = val >= 10 ? "text-green-600" : val >= 7 ? "text-blue-600" : val >= 4 ? "text-amber-600" : "text-red-600";
  return (
    <div className="rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{val} <span className="text-sm font-normal text-muted-foreground">km/L</span></p>
      <p className={`text-xs font-medium mt-0.5 ${color}`}>{rating}</p>
    </div>
  );
}

interface FleetChartsProps {
  vehicleStatusData: { available: number; onTrip: number; inShop: number; retired: number };
  monthlyCostData: { month: string; fuel: number; maintenance: number }[];
  fuelEfficiencyData: { name: string; kmpl: number }[];
}

export function FleetCharts({ vehicleStatusData, monthlyCostData, fuelEfficiencyData }: FleetChartsProps) {
  const donutData = [
    { name: "Available", value: vehicleStatusData.available, color: STATUS_COLORS[0] },
    { name: "On Trip", value: vehicleStatusData.onTrip, color: STATUS_COLORS[1] },
    { name: "In Shop", value: vehicleStatusData.inShop, color: STATUS_COLORS[2] },
    { name: "Retired", value: vehicleStatusData.retired, color: STATUS_COLORS[3] },
  ].filter(d => d.value > 0);

  const total = donutData.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;

  const avgEfficiency = fuelEfficiencyData.length
    ? Math.round((fuelEfficiencyData.reduce((s, d) => s + d.kmpl, 0) / fuelEfficiencyData.length) * 100) / 100
    : 0;

  const monthlyWithTotal = monthlyCostData.map(m => ({
    ...m,
    total: Math.round((m.fuel + m.maintenance) * 100) / 100,
  }));

  const getBarColor = (kmpl: number) =>
    kmpl >= 10 ? "#22c55e" : kmpl >= 7 ? "#3b82f6" : kmpl >= 4 ? "#d97706" : "#ef4444";

  return (
    <div className="grid gap-6 md:grid-cols-3 mt-6">
      {/* Status Donut */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fleet Status</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No vehicles</div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 -mt-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Cost Trend */}
      <Card className="md:col-span-2 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Cost Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyWithTotal} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="maintGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={45} />
              <Tooltip content={<LineTooltip />} cursor={false} />
              <Area type="monotone" dataKey="fuel" name="Fuel" stroke="#f59e0b" strokeWidth={2} fill="url(#fuelGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="maintenance" name="Maintenance" stroke="#ef4444" strokeWidth={2} fill="url(#maintGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fuel Efficiency */}
      {fuelEfficiencyData.length > 0 && (
        <Card className="md:col-span-3 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fuel Efficiency (km/L)</CardTitle>
            <span className="text-xs text-muted-foreground">
              Fleet avg: <span className="font-semibold text-foreground">{avgEfficiency} km/L</span>
            </span>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelEfficiencyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={35} />
                <Tooltip content={<BarTooltip />} cursor={false} />
                <ReferenceLine y={avgEfficiency} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="kmpl" name="km/L" radius={[6, 6, 0, 0]}>
                  {fuelEfficiencyData.map((entry) => (
                    <Cell key={entry.name} fill={getBarColor(entry.kmpl)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
