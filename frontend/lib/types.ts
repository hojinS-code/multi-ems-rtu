export type DeviceType = "single_phase" | "three_phase";
export type Protocol = "TCP" | "RTU";
export type Metric = "voltage" | "current" | "power_factor" | "active_power" | "reactive_power" | "energy";
export type ErrorType = "connection_failed" | "read_failed" | "unknown_device_type";
export type Phase = "r" | "s" | "t";

export interface Device {
    id: string;
    name: string;
    device_type: DeviceType;
    protocol: Protocol;
    serial_port: string | null;
    baudrate: number | null;
    host: string | null;
    port: number | null;
    slave_id: number;
    is_active: boolean;
}

export interface DeviceError {
    id: string;
    device_id: string;
    error_type: ErrorType;
    message: string;
    occurred_at: string;
    resolved_at: string | null;
}

// GET /measurements/realtime/{device_id} 응답 (단상)
export interface SinglePhaseMeasurement {
    id: string;
    device_id: string;
    timestamp: string;
    voltage: number | null;
    current: number | null;
    power_factor: number | null;
    active_power: number | null;
    reactive_power: number | null;
}

// GET /measurements/realtime/{device_id} 응답 (3상)
export interface ThreePhaseMeasurement {
    id: string;
    device_id: string;
    timestamp: string;
    voltage_r: number | null;
    voltage_s: number | null;
    voltage_t: number | null;
    current_r: number | null;
    current_s: number | null;
    current_t: number | null;
    power_factor: number | null;
    active_power: number | null;
    reactive_power: number | null;
}

// GET /measurements/monthly/{device_id} 응답 항목
export interface MonthlyPoint {
    date: string;
    value: number | null;
}

export interface MonthlyPhasePoint {
    date: string;
    r: number | null;
    s: number | null;
    t: number | null;
}

// GET /measurements/peak-15min/{device_id} 응답 항목
export interface PeakPoint {
    time: string;
    value: number | null;
}