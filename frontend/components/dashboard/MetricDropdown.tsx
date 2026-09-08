import type { Metric, EnvMetric, DeviceType } from "@/lib/types";

interface MetricDropdownProps {
    deviceType: DeviceType;
    selectedMetric: string;
    onSelect: (metric: string) => void;
}

const METRIC_LABELS: Record<Metric, string> = {
    voltage: "전압",
    current: "전류",
    power_factor: "역률",
    active_power: "유효전력",
    reactive_power: "무효전력",
    energy: "전력량",
    power: "전력",
};

const ENV_METRIC_LABELS: Record<EnvMetric, string> = {
    temperature: "온도",
    humidity: "습도",
    illuminance: "조도",
}

export default function MetricDropdown({ deviceType, selectedMetric, onSelect }: MetricDropdownProps) {
    const labels = deviceType === "environment" ? ENV_METRIC_LABELS : METRIC_LABELS;

    return (
        <select
            value={selectedMetric}
            onChange={(e) => onSelect(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
        >
            {Object.keys(labels).map((metric) => (
                <option key={metric} value={metric}>
                    {(labels as Record<string, string>)[metric]}
                </option>
            ))}
        </select>
    );
}