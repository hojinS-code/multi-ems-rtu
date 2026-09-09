"use client";

import { useState, useEffect, WheelEvent, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
import type { Device, Metric, SinglePhaseMeasurement, ThreePhaseMeasurement, Phase } from "@/lib/types";

interface RealtimeChartProps {
    device: Device;
    metric: Metric;
    data: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
}


function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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

const METRIC_ALIASES: Partial<Record<Metric, keyof SinglePhaseMeasurement>> = {
    power: "active_power"
};

export default function RealtimeChart({ device, metric, data }: RealtimeChartProps) {

    const isPhaseMetric = metric === "voltage" || metric === "current";

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

    if (device.device_type === "single_phase" || !isPhaseMetric) {
        const chartData = (data as SinglePhaseMeasurement[]).map((m) => ({
            time: formatTime(m.timestamp),
            value: m[METRIC_ALIASES[metric] ?? (metric as keyof SinglePhaseMeasurement)],
        }));

        const { range, setRange, containerRef } = useWheelZoom(chartData.length);

        return (
            <div ref={containerRef} style={{ cursor: "zoom-in" }}>
                <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name="값" />
                        <Brush
                            dataKey="time"
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

    const phaseKey = (phase: Phase) => `${metric}_${phase}` as keyof ThreePhaseMeasurement;

    const chartData = (data as ThreePhaseMeasurement[]).map((m) => ({
        time: formatTime(m.timestamp),
        r: m[phaseKey("r")],
        s: m[phaseKey("s")],
        t: m[phaseKey("t")],
    }));

    const { range, setRange, containerRef } = useWheelZoom(chartData.length);

    return (
        <div ref={containerRef} style={{ cursor: "zoom-in" }}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend onClick={(e) => togglePhase(e.dataKey as Phase)} />
                    <Line type="monotone" dataKey="r" stroke="#dc2626" dot={false} name="R상" hide={!visiblePhases.has("r")} />
                    <Line type="monotone" dataKey="s" stroke="#16a34a" dot={false} name="S상" hide={!visiblePhases.has("s")} />
                    <Line type="monotone" dataKey="t" stroke="#2563eb" dot={false} name="T상" hide={!visiblePhases.has("t")} />
                    <Brush
                        dataKey="time"
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