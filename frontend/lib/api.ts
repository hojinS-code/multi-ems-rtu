import type {
    Device,
    DeviceError,
    SinglePhaseMeasurement,
    ThreePhaseMeasurement,
    MonthlyPoint,
    PeakPoint,
    Metric,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) {
        throw new Error(`API 요청 실패: ${path} (status ${res.status})`);
    }
    return res.json();
}

export function getDevices(): Promise<Device[]> {
    return fetchJson<Device[]>("/devices");
}

export function getDevice(deviceId: string): Promise<Device> {
    return fetchJson<Device>(`/devices/${deviceId}`);
}

export function getRealtimeMeasurements(
    deviceId: string,
    metric: Metric,
    minutes: number = 30
): Promise<(SinglePhaseMeasurement | ThreePhaseMeasurement)[]> {
    return fetchJson(`/measurements/realtime/${deviceId}?metric=${metric}&minutes=${minutes}`);
}

export function getMonthlyMeasurements(
    deviceId: string,
    metric: Metric,
    year: number,
    month: number
): Promise<MonthlyPoint[]> {
    return fetchJson(`/measurements/monthly/${deviceId}?metric=${metric}&year=${year}&month=${month}`);
}

export function getPeak15min(deviceId: string, date: string): Promise<PeakPoint[]> {
    return fetchJson(`/measurements/peak-15min/${deviceId}?date=${date}`);
}

export function getDeviceErrors(
    deviceId: string,
    unresolvedOnly: boolean = false
): Promise<DeviceError[]> {
    return fetchJson(`/device-errors/${deviceId}?unresolved_only=${unresolvedOnly}`);
}

export async function resolveDeviceError(errorId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/device-errors/${errorId}/resolve`, {
        method: "PATCH",
    });
    if (!res.ok) {
        throw new Error(`에러 해결 처리 실패 (status ${res.status})`);
    }
} 