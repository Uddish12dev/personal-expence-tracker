"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import type { CategoryTotal, DailyPoint, MonthPoint } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  fontSize: "0.875rem",
};

export function SpendingDonut({
  data,
  currency,
}: {
  data: CategoryTotal[];
  currency: string;
}) {
  if (data.length === 0) {
    return <Empty label="No expenses this month yet." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.categoryId ?? "uncat"} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={tooltipStyle}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.8rem" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseBars({
  data,
  currency,
}: {
  data: MonthPoint[];
  currency: string;
}) {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return <Empty label="Add transactions to see your monthly trend." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={tooltipStyle}
          cursor={{ fill: "rgba(16,185,129,0.06)" }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.8rem" }} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailySpendArea({
  data,
  currency,
}: {
  data: DailyPoint[];
  currency: string;
}) {
  if (data.every((d) => d.cumulative === 0)) {
    return <Empty label="No expenses recorded this month." />;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" interval={4} />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          labelFormatter={(l) => `Day ${l}`}
          contentStyle={tooltipStyle}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Cumulative spend"
          stroke="#14b8a6"
          strokeWidth={2}
          fill="url(#spend)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-ink-400">
      {label}
    </div>
  );
}
