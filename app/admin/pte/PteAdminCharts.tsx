"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useId } from "react";

type TrendDatum = {
  label: string;
  value: number;
};

type PteTrendChartProps = {
  title: string;
  data: TrendDatum[];
  valueType?: "count" | "money";
};

type BarDatum = {
  label: string;
  count?: number;
  amount?: number;
};

type PteBarChartProps = {
  title: string;
  data: BarDatum[];
  valueType?: "count" | "money";
  xAxisLabel?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatValue(value: number, valueType: "count" | "money") {
  return valueType === "money" ? formatMoney(value) : String(value);
}

export function PteTrendChart({
  title,
  data,
  valueType = "count",
}: PteTrendChartProps) {
  const chartId = useId().replaceAll(":", "");
  const max = Math.max(...data.map((item) => item.value), 0);
  const yMax = Math.max(Math.ceil(max / 5) * 5, valueType === "money" ? 50 : 5);

  return (
    <div className="border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100/60">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Weekly
        </span>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <defs>
              <linearGradient id={`${chartId}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              minTickGap={28}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
              tickLine={{ stroke: "#9ca3af" }}
              axisLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              domain={[0, yMax]}
              tickFormatter={(value) => formatValue(Number(value), valueType)}
              width={valueType === "money" ? 64 : 36}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
              tickLine={{ stroke: "#9ca3af" }}
              axisLine={{ stroke: "#d1d5db" }}
            />
            <Tooltip
              cursor={{ stroke: "#826d84", strokeWidth: 1 }}
              formatter={(value) => [formatValue(Number(value), valueType), valueType === "money" ? "Revenue" : "Leads"]}
              labelFormatter={(label) => `Week of ${label}`}
              contentStyle={{
                border: "1px solid #e5e7eb",
                borderRadius: 0,
                boxShadow: "0 12px 24px rgb(17 24 39 / 0.08)",
                color: "#111827",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1e3a8a"
              strokeWidth={3}
              fill={`url(#${chartId}-fill)`}
              dot={{ r: 3, fill: "#1e3a8a", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#1e3a8a", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {data.map((item) => (
          <li key={item.label}>
            Week of {item.label}: {formatValue(item.value, valueType)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PteBarChart({
  title,
  data,
  valueType = "count",
  xAxisLabel,
}: PteBarChartProps) {
  const dataKey = valueType === "money" ? "amount" : "count";
  const normalizedData = data.map((item) => ({
    ...item,
    value: item[dataKey] ?? 0,
  }));
  const max = Math.max(...normalizedData.map((item) => item.value), 0);
  const yMax = Math.max(Math.ceil(max / 5) * 5, valueType === "money" ? 50 : 5);

  return (
    <div className="border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100/60">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {valueType === "money" ? "AUD" : "Count"}
        </span>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} margin={{ top: 8, right: 16, bottom: xAxisLabel ? 42 : 18, left: 8 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              minTickGap={16}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
              tickLine={{ stroke: "#9ca3af" }}
              axisLine={{ stroke: "#d1d5db" }}
              label={
                xAxisLabel
                  ? {
                      value: xAxisLabel,
                      position: "insideBottom",
                      offset: -22,
                      fill: "#4b5563",
                      fontSize: 12,
                      fontWeight: 700,
                    }
                  : undefined
              }
            />
            <YAxis
              domain={[0, yMax]}
              tickFormatter={(value) => formatValue(Number(value), valueType)}
              width={valueType === "money" ? 64 : 36}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
              tickLine={{ stroke: "#9ca3af" }}
              axisLine={{ stroke: "#d1d5db" }}
            />
            <Tooltip
              cursor={{ fill: "#f3f4f6" }}
              formatter={(value) => [formatValue(Number(value), valueType), valueType === "money" ? "Revenue" : "Count"]}
              contentStyle={{
                border: "1px solid #e5e7eb",
                borderRadius: 0,
                boxShadow: "0 12px 24px rgb(17 24 39 / 0.08)",
                color: "#111827",
              }}
            />
            <Bar dataKey="value" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {normalizedData.map((item) => (
          <li key={item.label}>
            {item.label}: {formatValue(item.value, valueType)}
          </li>
        ))}
      </ul>
    </div>
  );
}
