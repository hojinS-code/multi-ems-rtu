import type { Device } from "@/lib/types";

interface DeviceSelectorProps {
    devices: Device[];
    selectedDeviceId: number | null;
    onSelect: (deviceId: number) => void;
}

const DEVICE_TYPE_LABELS: Record<string, string> = {
    single_phase: "단상",
    three_phase: "3상",
    environment: "온습도조도계",
};

export default function DeviceSelector({ devices, selectedDeviceId, onSelect }: DeviceSelectorProps) {
    return (
        <select
            value={selectedDeviceId ?? ""}
            onChange={(e) => onSelect(Number(e.target.value))}
            className="border rounded px-3 py-2 text-sm min-w-0 max-w-full"
        >
            {devices.map((device) => (
                <option key={device.id} value={device.id}>
                    {device.name} ({DEVICE_TYPE_LABELS[device.device_type] ?? device.device_type})
                </option>
            ))}
        </select>
    );
}