import type { Device, DeviceError } from "@/lib/types";

interface DeviceStatusBadgeProps {
    device: Device;
    unresolvedErrors: DeviceError[];
}

export default function DeviceStatusBadge({ device, unresolvedErrors }: DeviceStatusBadgeProps) {
    if (!device.is_active) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-sm">
                비활성
            </span>
        );
    }

    if (unresolvedErrors.length > 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm">
                통신 이상 ({unresolvedErrors.length}건)
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm">
            정상
        </span>
    );
}