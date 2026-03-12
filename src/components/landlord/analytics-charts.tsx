"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart2 } from "lucide-react";

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface FunnelDataPoint {
  stage: string;
  count: number;
}

interface OccupancyDataPoint {
  property: string;
  occupancy: number;
  total: number;
  occupied: number;
}

interface AnalyticsChartsProps {
  revenueChartData: RevenueDataPoint[];
  funnelData: FunnelDataPoint[];
  occupancyByProperty: OccupancyDataPoint[];
}

function formatDollar(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
  labelStyle: { fontWeight: 600, color: "#111827" },
};

export function AnalyticsCharts({
  revenueChartData,
  funnelData,
  occupancyByProperty,
}: AnalyticsChartsProps) {
  const hasRevenue = revenueChartData.some((d) => d.revenue > 0);
  const hasOccupancy = occupancyByProperty.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue over time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Revenue — last 6 months
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatDollar}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Revenue"]}
                  {...TOOLTIP_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              No payment data in the last 6 months
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupancy by property */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Occupancy by property
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasOccupancy ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={occupancyByProperty}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="property"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0)}%`, "Occupancy"]}
                  {...TOOLTIP_STYLE}
                />
                <Bar
                  dataKey="occupancy"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              No property data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application funnel bar chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Application funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData.some((f) => f.count > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), "Applications"]}
                  {...TOOLTIP_STYLE}
                />
                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[0, 4, 4, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
              No applications yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
