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
    const isIndividualPhaseMetric = [
        "voltage_l1", "voltage_l2", "voltage_l3",
        "current_l1", "current_l2", "current_l3",
    ].includes(metric);

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

    if (device.device_type === "single_phase" || !isPhaseMetric || isIndividualPhaseMetric) {
        const isThreePhaseDevice = device.device_type === "three_phase";
        const chartData = (isThreePhaseDevice ? (data as ThreePhaseMeasurement[]) : (data as SinglePhaseMeasurement[])).map((m: any) => ({
            time: formatTime(m.timestamp),
            value: isIndividualPhaseMetric
                ? m[metric as keyof ThreePhaseMeasurement]
                : m[METRIC_ALIASES[metric] ?? (metric as keyof SinglePhaseMeasurement)],
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
        l1: m[phaseKey("l1")],
        l2: m[phaseKey("l2")],
        l3: m[phaseKey("l3")],
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
                    <Line type="monotone" dataKey="l1" stroke="#dc2626" dot={false} name="L1상" hide={!visiblePhases.has("l1")} />
                    <Line type="monotone" dataKey="l2" stroke="#16a34a" dot={false} name="L2상" hide={!visiblePhases.has("l2")} />
                    <Line type="monotone" dataKey="l3" stroke="#2563eb" dot={false} name="L3상" hide={!visiblePhases.has("l3")} />
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