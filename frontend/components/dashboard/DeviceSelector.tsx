import type { Device } from "@/lib/types";

interface DeviceSelectorProps {
    devices: Device[];
    selectedDeviceId: string | null;
    onSelect: (deviceId: string) => void;
}

export default function DeviceSelector({ devices, selectedDeviceId, onSelect }: DeviceSelectorProps) {
    return (
        <select
            value={selectedDeviceId ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
        >
            {devices.map((device) => (
                <option key={device.id} value={device.id}>
                    {device.name} ({device.device_type === "single_phase" ? "단상" : "3상"})
                </option>
            ))}
        </select>
    );
}