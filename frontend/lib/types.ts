export type DeviceType = "single_phase" | "three_phase" | "environment";
export type Protocol = "TCP" | "RTU";
export type Metric =
    | "voltage" | "current" | "power_factor" | "active_power" | "reactive_power" | "energy" | "power"
    | "voltage_l1" | "voltage_l2" | "voltage_l3"
    | "current_l1" | "current_l2" | "current_l3";
export type ErrorType = "connection_failed" | "read_failed" | "unknown_device_type";
export type EnvMetric = "temperature" | "humidity" | "illuminance";
export type Phase = "l1" | "l2" | "l3";

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
    voltage_l1: number | null;
    voltage_l2: number | null;
    voltage_l3: number | null;
    current_l1: number | null;
    current_l2: number | null;
    current_l3: number | null;
    power_factor: number | null;
    active_power: number | null;
    reactive_power: number | null;
}

export interface EnvironmentMeasurement {
    id: string;
    device_id: string;
    timestamp: string;
    temperature: number | null;
    humidity: number | null;
    illuminance: number | null;
}

export interface EnvironmentMonthlyPoint {
    date: string;
    value: number | null;
}

// GET /measurements/monthly/{device_id} 응답 항목
export interface MonthlyPoint {
    date: string;
    value: number | null;
}

export interface MonthlyPhasePoint {
    date: string;
    l1: number | null;
    l2: number | null;
    l3: number | null;
}

// GET /measurements/peak-15min/{device_id} 응답 항목
export interface PeakPoint {
    time: string;
    value: number | null;
}