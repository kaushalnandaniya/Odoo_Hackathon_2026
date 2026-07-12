"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartsProps {
  costData: { name: string; maintenance: number; fuel: number; expenses: number }[];
  trendData: { month: string; revenue: number; expenses: number }[];
  tripStatusData: { name: string; value: number; color: string }[];
}

const currencyFormatter = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

// Custom tooltip for the cost bar chart
const CostTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{currencyFormatter(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Custom tooltip for line chart
const TrendTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{currencyFormatter(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardCharts({ costData, trendData, tripStatusData }: ChartsProps) {
  const hasAnyCost = costData.some(d => d.maintenance + d.fuel + d.expenses > 0);
  const hasAnyRevenue = trendData.some(d => d.revenue + d.expenses > 0);
  const hasTripStatus = tripStatusData.length > 0;

  return (
    <div className="mt-4 space-y-6">
      {/* Row 1: Cost per vehicle + Trip Status side by side */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cost per vehicle — takes 2/3 width */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Costs per Vehicle</CardTitle>
            <p className="text-sm text-muted-foreground">Fuel, maintenance &amp; operational expenses</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {hasAnyCost ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={currencyFormatter} width={70} />
                  <RechartsTooltip content={<CostTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expenses" name="Other Expenses" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No cost data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trip Status Donut — takes 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Status</CardTitle>
            <p className="text-sm text-muted-foreground">Current distribution of all trips</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {hasTripStatus ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tripStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                  >
                    {tripStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const item = tripStatusData.find(d => d.name === value);
                      return (
                        <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>
                          {value} ({item?.value ?? 0})
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No trips recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue vs Expenses trend — full width */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses — Last 6 Months</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly completed trip revenue compared to total operational expenses</p>
        </CardHeader>
        <CardContent className="h-[280px]">
          {hasAnyRevenue ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={currencyFormatter} width={75} />
                <RechartsTooltip content={<TrendTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Total Expenses"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No revenue or expense data in the last 6 months
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
