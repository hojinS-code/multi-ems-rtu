"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Device, Metric, SinglePhaseMeasurement, ThreePhaseMeasurement, Phase } from "@/lib/types";

interface RealtimeChartProps {
    device: Device;
    metric: Metric;
    data: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
}


function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const METRIC_ALIASES: Partial<Record<Metric, keyof SinglePhaseMeasurement>> = {
    power: "active_power"
};

export default function RealtimeChart({ device, metric, data }: RealtimeChartProps) {
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

    if (device.device_type === "single_phase") {
        const chartData = (data as SinglePhaseMeasurement[]).map((m) => ({
            time: formatTime(m.timestamp),
            value: m[METRIC_ALIASES[metric] ?? (metric as keyof SinglePhaseMeasurement)],
        }));

        return (
            <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name="값" />
                </LineChart>
            </ResponsiveContainer>
        );
    }

    const phaseKey = (phase: Phase) => `${metric}_${phase}` as keyof ThreePhaseMeasurement;

    const chartData = (data as ThreePhaseMeasurement[]).map((m) => ({
        time: formatTime(m.timestamp),
        r: m[phaseKey("r")],
        s: m[phaseKey("s")],
        t: m[phaseKey("t")],
    }));

    return (
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
            </LineChart>
        </ResponsiveContainer>
    );
}