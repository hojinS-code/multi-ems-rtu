import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { EnergyResponse } from "@/lib/api";

interface EnergyChartProps {
    data: EnergyResponse;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function EnergyChart({ data }: EnergyChartProps) {
    const chartData = data.daily.map((point) => ({
        date: formatDate(point.date),
        kwh: point.kwh,
    }));

    return (
        <div>
            <p className="text-lg font-semibold mb-3">
                이번 달 총 사용량:<span className="text-blue-600">{data.total_kwh.toLocaleString()} kWh</span>
            </p>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="kwh" fill="#059669" name="일일 사용량 (kWh)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}