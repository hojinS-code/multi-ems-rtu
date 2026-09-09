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
    voltage_l1: "전압(L1)",
    voltage_l2: "전압(L2)",
    voltage_l3: "전압(L3)",
    current_l1: "전류(L1)",
    current_l2: "전류(L2)",
    current_l3: "전류(L3)",
};

const ENV_METRIC_LABELS: Record<EnvMetric, string> = {
    temperature: "온도",
    humidity: "습도",
    illuminance: "조도",
};

const SINGLE_PHASE_METRICS: Metric[] = ["voltage", "current", "power_factor", "active_power", "reactive_power", "power", "energy"];

const THREE_PHASE_ONLY_METRICS: Metric[] = ["voltage_l1", "voltage_l2", "voltage_l3", "current_l1", "current_l2", "current_l3"];

export default function MetricDropdown({ deviceType, selectedMetric, onSelect }: MetricDropdownProps) {
    if (deviceType === "environment") {
        return (
            <select
                value={selectedMetric}
                onChange={(e) => onSelect(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
            >
                {Object.keys(ENV_METRIC_LABELS).map((metric) => (
                    <option key={metric} value={metric}>
                        {(ENV_METRIC_LABELS as Record<string, string>)[metric]}
                    </option>
                ))}
            </select>
        );
    }

    const metricKeys: Metric[] =
        deviceType === "three_phase"
            ? [...SINGLE_PHASE_METRICS, ...THREE_PHASE_ONLY_METRICS]
            : SINGLE_PHASE_METRICS;
    return (
        <select
            value={selectedMetric}
            onChange={(e) => onSelect(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
        >
            {metricKeys.map((metric) => (
                <option key={metric} value={metric}>
                    {METRIC_LABELS[metric]}
                </option>
            ))}
        </select>
    );
}