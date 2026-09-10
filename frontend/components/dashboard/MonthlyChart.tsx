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
    setRange((prev) => {
      const [start, end] = prev;
      if (end > length - 1 || start > length - 1) {
        return [0, Math.max(length - 1, 0)];
      }
      return prev;
    });
  }, [length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const ratio = Math.min(Math.max(mouseX / rect.width, 0), 1);

      setRange(([start, end]) => {
        const currentSpan = end - start;
        const pivot = start + currentSpan * ratio;
        const factor = e.deltaY < 0 ? 0.8 : 1.25;
        let newSpan = currentSpan * factor;
        newSpan = Math.max(4, Math.min(length - 1, newSpan));

        let newStart = Math.round(pivot - newSpan * ratio);
        let newEnd = Math.round(pivot + newSpan * (1 - ratio));

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
  const [visiblePhases, setVisiblePhases] = useState<Set<Phase>>(new Set(["l1", "l2", "l3"]));

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
      l1: point.l1,
      l2: point.l2,
      l3: point.l3,
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
            <Line type="monotone" dataKey="l1" stroke="#dc2626" dot={false} name="L1상" hide={!visiblePhases.has("l1")} />
            <Line type="monotone" dataKey="l2" stroke="#16a34a" dot={false} name="L2상" hide={!visiblePhases.has("l2")} />
            <Line type="monotone" dataKey="l3" stroke="#2563eb" dot={false} name="L3상" hide={!visiblePhases.has("l3")} />
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