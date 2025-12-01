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
  const { data, error, isLoading } = useSWR("/api/strava/activities", fetcher, {
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
    <div style={{ width: "100%", height: 360 }}>
      <h3 style={{ marginBottom: 8 }}>Weekly Activity Distance (km)</h3>
      <ResponsiveContainer width="100%" height="78%">
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, "auto"]} />
          <Tooltip formatter={(value: any, name: any) => [`${value} km`, name]} />
          <Line
            type="monotone"
            dataKey="km"
            stroke="#1976d2"
            strokeWidth={2}
            dot={<Dot />}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
        Showing {chartData.length} weeks. Last updated:{" "}
        {data.meta?.fetchedAt ? new Date(data.meta.fetchedAt).toLocaleString() : "unknown"}
      </div>
    </div>
  );
}
