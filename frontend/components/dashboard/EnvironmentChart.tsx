import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { EnvironmentMeasurement, EnvironmentMonthlyPoint, EnvMetric } from "@/lib/types";

interface EnvironmentRealtimeChartProps {
    metric: EnvMetric;
    data: EnvironmentMeasurement[];
}

interface EnvironmentMonthlyChartProps {
    data: EnvironmentMonthlyPoint[];
}

function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function EnvironmentRealtimeChart({ metric, data }: EnvironmentRealtimeChartProps) {
    const chartData = data.map((m) => ({
        time: formatTime(m.timestamp),
        value: m[metric],
    }));

    return (
        <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#059669" dot={false} name="값" />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function EnvironmentMonthlyChart({ data }: EnvironmentMonthlyChartProps) {
    const chartData = data.map((point) => ({
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
                <Line type="monotone" dataKey="value" stroke="#059669" dot={false} name="일 평균" />
            </LineChart>
        </ResponsiveContainer>
    );
}