import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MonthlyPoint } from "@/lib/types";

interface MonthlyChartProps {
    data: MonthlyPoint[];
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
    const chartData = data.map((point) => ({
        date: formatDate(point.date),
        value: point.value,
    }));

    return (
        <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name="일 평균" />
            </LineChart>
        </ResponsiveContainer >
    );
}