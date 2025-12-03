"use client";

import useSWR from "swr";
import { Loader2 } from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

type AggregatedWeek = {
  weekStartISO: string;
  totalDistanceKm: number;
  activitiesCount: number;
};

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(txt || "Network response not ok");
    }
    return r.json();
  });

export default function RunningStats() {
  const { data, error, isLoading } = useSWR("/api/strava/", fetcher, {
    refreshInterval: 60 * 1000, // optional revalidate
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (error) return <div style={{ color: "red" }}>Error: {String(error.message)}</div>;
  if (!data) return <div>No data</div>;

  const aggregated: AggregatedWeek[] = data.aggregated ?? [];

  const chartData = aggregated.map((w) => ({
    week: w.weekStartISO,
    km: w.totalDistanceKm,
    count: w.activitiesCount,
  }));

  return (
  <div className="w-full h-[360px] px-4 py-2 flex flex-col items-center justify-center">
    {/* Title */}
    <h3 className="w-full text-center text-lg font-medium mb-2">
      Weekly Activity Distance (km)
    </h3>

    {/* Chart area: take remaining space so footer doesn't get pushed down */}
    <div className="w-full flex-1 min-h-[140px]">
      {/* ResponsiveContainer must fill its parent — use height="100%" */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="week" 
            tick={false}     
            tickLine={true}  
            axisLine={true}  
          />
          <YAxis domain={[0, "auto"]} />
          <Tooltip
            formatter={(v, n) => [`${v}`, n]}
            contentStyle={{
              borderRadius: "10px",
            }}
            labelStyle={{ color: "black" }}
            itemStyle={{ color: "#1976d2" }}
          />
          <Line
            type="monotone"
            dataKey="km"
            stroke="#1976d2"
            strokeWidth={1.5}
            dot={<Dot />}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Footer line (tight spacing) */}
    <p className="w-full text-center mt-2 text-sm text-gray-500 dark:text-gray-400 pb-0">
      Showing {chartData.length} weeks. Last updated:{" "}
      {data.meta?.fetchedAt ? new Date(data.meta.fetchedAt).toLocaleString() : "unknown"}
    </p>
  </div>
);
}