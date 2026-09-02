"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Device, Metric, MonthlyPoint, MonthlyPhasePoint, Phase } from "@/lib/types";

interface MonthlyChartProps {
  device: Device;
  metric: Metric;
  data: (MonthlyPoint | MonthlyPhasePoint)[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isPhaseData(point: MonthlyPoint | MonthlyPhasePoint): point is MonthlyPhasePoint {
  return "r" in point;
}

export default function MonthlyChart({ device, metric, data }: MonthlyChartProps) {
  const [visiblePhases, setVisiblePhases] = useState<Set<Phase>>(new Set(["r", "s", "t"]));

  const togglePhase = (phase: Phase) => {
    setVisiblePhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  const isThreePhaseData = device.device_type === "three_phase" && (metric === "voltage" || metric === "current");

  if (isThreePhaseData) {
    const chartData = (data as MonthlyPhasePoint[]).map((point) => ({
      date: formatDate(point.date),
      r: point.r,
      s: point.s,
      t: point.t,
    }));

    return (
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend onClick={(e) => togglePhase(e.dataKey as Phase)} />
          <Line type="monotone" dataKey="r" stroke="#dc2626" dot={false} name="R상" hide={!visiblePhases.has("r")} />
          <Line type="monotone" dataKey="s" stroke="#16a34a" dot={false} name="S상" hide={!visiblePhases.has("s")} />
          <Line type="monotone" dataKey="t" stroke="#2563eb" dot={false} name="T상" hide={!visiblePhases.has("t")} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const chartData = (data as MonthlyPoint[]).map((point) => ({
    date: formatDate(point.date),
    value: point.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name="일 평균" />
      </LineChart>
    </ResponsiveContainer>
  );
}