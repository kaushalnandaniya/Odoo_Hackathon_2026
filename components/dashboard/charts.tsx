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
  CartesianGrid
} from "recharts";

interface ChartsProps {
  costData: { name: string; maintenance: number; fuel: number }[];
}

export function DashboardCharts({ costData }: ChartsProps) {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Top Costs per Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={costData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <RechartsTooltip formatter={(value) => [`$${value}`, undefined]} cursor={{fill: 'transparent'}} />
              <Legend />
              <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
              <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
