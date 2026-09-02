import type { Metric } from "@/lib/types";

interface MetricDropdownProps {
    selectedMetric: Metric;
    onSelect: (metric: Metric) => void;
}

const METRIC_LABELS: Record<Metric, string> = {
    voltage: "전압",
    current: "전류",
    power_factor: "역률",
    active_power: "유효전력",
    reactive_power: "무효전력",
};

export default function MetricDropdown({ selectedMetric, onSelect }: MetricDropdownProps) {
    return (
        <select
            value={selectedMetric}
            onChange={(e) => onSelect(e.target.value as Metric)}
            className="border rounded px-3 py-2 text-sm"
        >
            {(Object.keys(METRIC_LABELS) as Metric[]).map((metric) => (
                <option key={metric} value={metric}>
                    {METRIC_LABELS[metric]}
                </option>
            ))}
        </select>
    );
}