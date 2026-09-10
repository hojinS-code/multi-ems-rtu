import type { Device, Metric, SinglePhaseMeasurement, ThreePhaseMeasurement } from "@/lib/types";

interface MetricReadoutProps {
    device: Device;
    metric: Metric;
    data: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
}

const METRIC_UNITS: Record<string, string> = {
    voltage: "V",
    current: "A",
    power_factor: "",
    active_power: "kW",
    reactive_power: "kvar",
    power: "kW",
    voltage_l1: "V",
    voltage_l2: "V",
    voltage_l3: "V",
    current_l1: "A",
    current_l2: "A",
    current_l3: "A",
};

const METRIC_ALIASES: Record<string, string> = {
    power: "active_power",
};

const PHASE_METRIC_LABELS: Record<string, string> = {
    voltage: "전압",
    current: "전류",
};

function Readout({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
            <span className="font-numeric text-3xl font-semibold text-[var(--foreground)]">
                {value !== null && value !== undefined ? value.toFixed(1) : "-"}
                <span className="text-lg font-normal text-[var(--foreground-muted)] ml-1">{unit}</span>
            </span>
        </div>
    );
}

export default function MetricReadout({ device, metric, data }: MetricReadoutProps) {
    if (data.length === 0) {
        return <div className="text-sm text-[var(--foreground-muted)]">데이터 없음</div>
    }

    const latest = data[data.length - 1];
    const unit = METRIC_UNITS[metric] ?? "";
    const isPhaseMetric = metric === "voltage" || metric === "current";

    if (device.device_type === "three_phase" && isPhaseMetric) {
        const record = latest as ThreePhaseMeasurement;
        const baseLabel = PHASE_METRIC_LABELS[metric];
        return (
            <div className="flex gap-8">
                <Readout label={`${baseLabel}1`} value={record[`${metric}_l1` as keyof ThreePhaseMeasurement] as number | null} unit={unit} />
                <Readout label={`${baseLabel}2`} value={record[`${metric}_l2` as keyof ThreePhaseMeasurement] as number | null} unit={unit} />
                <Readout label={`${baseLabel}3`} value={record[`${metric}_l3` as keyof ThreePhaseMeasurement] as number | null} unit={unit} />
            </div>
        );
    }

    const fieldName = METRIC_ALIASES[metric] ?? metric;
    const value = (latest as any)[fieldName] as number | null | undefined;
    const label = PHASE_METRIC_LABELS[metric] ?? metric;

    return (
        <div className='flex gap-8'>
            <Readout label={label} value={value} unit={unit} />
        </div>
    );
}