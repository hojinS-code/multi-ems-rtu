export type DeviceType = "single_phase" | "three_phase" | "environment";
export type Protocol = "TCP" | "RTU";
export type Wiring = "3W" | "4W";
export type Metric =
    | "voltage" | "current" | "power_factor" | "active_power" | "reactive_power" | "energy"
    | "voltage_l1" | "voltage_l2" | "voltage_l3"
    | "current_l1" | "current_l2" | "current_l3";
export type ErrorType = "connection_failed" | "read_failed" | "unknown_device_type";
export type EnvMetric = "temperature" | "humidity" | "illuminance";
export type Phase = "l1" | "l2" | "l3";
export type AlarmType = "over_voltage" | "under_voltage" | "over_current" | "over_power" | "phase_imbalance";
export type AlarmSeverity = "warning" | "critical";

export interface Device {
    id: number;
    name: string;
    device_type: DeviceType;
    protocol: Protocol;
    serial_port: string | null;
    baudrate: number | null;
    host: string | null;
    port: number | null;
    slave_id: number;
    location: string | null;
    wiring: Wiring | null;
    is_active: boolean;
}

export interface DeviceError {
    id: number;
    device_id: number;
    error_type: ErrorType;
    message: string;
    occurred_at: string;
    resolved_at: string | null;
}

// GET /measurements/realtime/{device_id} 응답 (단상)
export interface SinglePhaseMeasurement {
    id: number;
    device_id: number;
    timestamp: string;
    voltage: number | null;
    current: number | null;
    power_factor: number | null;
    active_power: number | null;
    reactive_power: number | null;
}

// GET /measurements/realtime/{device_id} 응답 (3상)
export interface ThreePhaseMeasurement {
    id: number;
    device_id: number;
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
    id: number;
    device_id: number;
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

export interface Alarm {
    id: number;
    device_id: number;
    alarm_type: AlarmType;
    severity: AlarmSeverity;
    message: string;
    occurred_at: string;
    resolved_at: string | null;
}