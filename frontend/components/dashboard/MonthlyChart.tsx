"use client";

import { useState, useEffect, WheelEvent, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
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

function useWheelZoom(length: number) {
  const [range, setRange] = useState<[number, number]>([0, Math.max(length - 1, 0)]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRange([0, Math.max(length - 1, 0)]);
  }, [length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setRange(([start, end]) => {
        const currentSpan = end - start;
        const center = (start + end) / 2;
        const factor = e.deltaY < 0 ? 0.8 : 1.25;
        let newSpan = currentSpan * factor;
        newSpan = Math.max(4, Math.min(length - 1, newSpan));

        let newStart = Math.round(center - newSpan / 2);
        let newEnd = Math.round(center + newSpan / 2);

        if (newStart < 0) {
          newEnd -= newStart;
          newStart = 0;
        }
        if (newEnd > length - 1) {
          newStart -= newEnd - (length - 1);
          newEnd = length - 1;
        }
        newStart = Math.max(0, newStart);

        return [newStart, newEnd];
      });
    };

    el.addEventListener("wheel", handleWheel as unknown as EventListener, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel as unknown as EventListener);
    };
  }, [length]);

  return { range, setRange, containerRef };
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

    const { range, setRange, containerRef } = useWheelZoom(chartData.length);

    return (
      <div ref={containerRef} style={{ cursor: "zoom-in" }}>
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
            <Brush
              dataKey="date"
              height={30}
              stroke="#2563eb"
              startIndex={range[0]}
              endIndex={range[1]}
              onChange={(r) => {
                if (r.startIndex !== undefined && r.endIndex !== undefined) {
                  setRange([r.startIndex, r.endIndex])
                }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const chartData = (data as MonthlyPoint[]).map((point) => ({
    date: formatDate(point.date),
    value: point.value,
  }));

  const { range, setRange, containerRef } = useWheelZoom(chartData.length);

  return (
    <div ref={containerRef} style={{ cursor: "zoom-in" }}>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name="일 평균" />
          <Brush
            dataKey="date"
            height={30}
            stroke="#2563eb"
            startIndex={range[0]}
            endIndex={range[1]}
            onChange={(r) => {
              if (r.startIndex !== undefined && r.endIndex !== undefined) {
                setRange([r.startIndex, r.endIndex]);
              }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}