import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PeakPoint } from "@/lib/types";

interface Peak15minChartProps {
    data: PeakPoint[];
}

export default function Peak15minChart({ data }: Peak15minChartProps) {
    return (
        <ResponsiveContainer width="100%" height={500}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" interval={7} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" name="15분 피크 유효전력" />
            </BarChart>
        </ResponsiveContainer>
    );
}