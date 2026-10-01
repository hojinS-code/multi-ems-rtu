"use client";

import type { Device } from "@/lib/types";

interface DeviceIdListProps {
    devices: Device[];
    selectedDeviceId: number | null;
    onSelect: (deviceId: number) => void;
}

export default function DeviceIdList({ devices, selectedDeviceId, onSelect }: DeviceIdListProps) {
    return (
        <nav className="space-y-1">
            {devices.map((device) => (
                <button
                    key={device.id}
                    onClick={() => onSelect(device.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm ${selectedDeviceId === device.id
                        ? "bg-[var(--accent)] text-white font-medium"
                        : "text-[var(--foreground)] hover:bg-[var(--background)]"
                        }`}
                >
                    ID {device.id}
                </button>
            ))}
        </nav>
    );
}