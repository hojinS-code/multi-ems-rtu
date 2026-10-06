"use client";

import { useState, useEffect, useCallback } from "react";
import type { Device, Metric, EnvMetric, SinglePhaseMeasurement, ThreePhaseMeasurement, MonthlyPoint, MonthlyPhasePoint, PeakPoint, DeviceError, EnvironmentMeasurement, EnvironmentMonthlyPoint, Alarm } from "@/lib/types";
import type { EnergyResponse } from "@/lib/api";
import {
    getDevices,
    getRealtimeMeasurements,
    getMonthlyMeasurements,
    getPeak15min,
    getDeviceErrors,
    resolveDeviceError,
    resolveAllDeviceErrors,
    getEnergy,
    getEnvironmentRealtime,
    getEnvironmentMonthly,
    getAlarms,
    resolveAlarm,
    resolveAllAlarms,
} from "@/lib/api";
import DashboardPresenter from "./DashboardPresenter";
import type { DashboardView } from "./ViewMenu";

const AUTO_REFRESH_MS = 60000;

export default function DashboardContainer() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [devicesLoaded, setDevicesLoaded] = useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<string>("voltage");
    const [activeView, setActiveView] = useState<DashboardView>("realtime");

    const now = new Date();
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().slice(0, 10));
    const [granularity, setGranularity] = useState<"day" | "hour" | "minute">("day");

    const [realtimeData, setRealtimeData] = useState<(SinglePhaseMeasurement | ThreePhaseMeasurement)[]>([]);
    const [monthlyData, setMonthlyData] = useState<(MonthlyPoint | MonthlyPhasePoint)[]>([]);
    const [peakData, setPeakData] = useState<PeakPoint[]>([]);
    const [errors, setErrors] = useState<DeviceError[]>([]);
    const [alarms, setAlarms] = useState<Alarm[]>([]);

    const [envRealtimeData, setEnvRealtimeData] = useState<EnvironmentMeasurement[]>([]);
    const [envMonthlyData, setEnvMonthlyData] = useState<EnvironmentMonthlyPoint[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [energyData, setEnergyData] = useState<EnergyResponse | null>(null);

    const selectedDevice = devices.find((d) => d.id === selectedDeviceId) ?? null;

    // 장비 목록 최초 1회 로드
    useEffect(() => {
        getDevices()
            .then((data) => {
                setDevices(data);
                if (data.length > 0) {
                    setSelectedDeviceId(data[0].id);
                }
            })
            .catch((e) => setError(e.message))
            .finally(() => setDevicesLoaded(true));
    }, []);

    // 장비가 바뀔 때 지표 기본값을 장비 타입에 맞게 리셋
    useEffect(() => {
        if (!selectedDevice) return;
        if (selectedDevice.device_type === "environment") {
            setSelectedMetric("temperature");
        } else {
            setSelectedMetric("voltage");
        }
    }, [selectedDevice?.id]);

    const fetchData = useCallback((showLoading: boolean) => {
        if (!selectedDeviceId || !selectedDevice) return;

        const today = new Date().toISOString().slice(0, 10);

        if (showLoading) setLoading(true);
        setError(null);

        if (selectedDevice.device_type === "environment") {
            Promise.all([
                getEnvironmentRealtime(selectedDeviceId, 360),
                getEnvironmentMonthly(
                    selectedDeviceId,
                    selectedMetric as EnvMetric,
                    selectedYear,
                    selectedMonth,
                    granularity,
                    granularity !== "day" ? selectedDate : undefined
                ),
                getDeviceErrors(selectedDeviceId, true),
                getAlarms(selectedDeviceId, true),
            ])
                .then(([envRealtime, envMonthly, deviceErrors, deviceAlarms]) => {
                    setEnvRealtimeData(envRealtime);
                    setEnvMonthlyData(envMonthly);
                    setErrors(deviceErrors);
                    setAlarms(deviceAlarms);
                })
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
            return;
        }

        if (selectedMetric === "energy") {
            Promise.all([
                getEnergy(selectedDeviceId, selectedYear, selectedMonth,),
                getPeak15min(selectedDeviceId, today),
                getDeviceErrors(selectedDeviceId, true),
                getAlarms(selectedDeviceId, true),
            ])
                .then(([energy, peak, deviceErrors, deviceAlarms]) => {
                    setEnergyData(energy);
                    setMonthlyData([]);
                    setRealtimeData([]);
                    setPeakData(peak);
                    setErrors(deviceErrors);
                    setAlarms(deviceAlarms)
                })
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
            return;
        }

        setEnergyData(null);

        Promise.all([
            getRealtimeMeasurements(selectedDeviceId, selectedMetric as Metric, 360),
            getMonthlyMeasurements(
                selectedDeviceId,
                selectedMetric as Metric,
                selectedYear,
                selectedMonth,
                granularity,
                granularity !== "day" ? selectedDate : undefined
            ),
            getPeak15min(selectedDeviceId, today),
            getDeviceErrors(selectedDeviceId, true),
            getAlarms(selectedDeviceId, true),
        ])
            .then(([realtime, monthly, peak, deviceErrors, deviceAlarms]) => {
                setRealtimeData(realtime);
                setMonthlyData(monthly);
                setPeakData(peak);
                setErrors(deviceErrors);
                setAlarms(deviceAlarms);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [selectedDeviceId, selectedDevice, selectedMetric, selectedYear, selectedMonth, granularity, selectedDate]);

    // 선택된 장비/지표/기간이 바뀔 때마다 즉시 재조회 (로딩 표시 O)
    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // 60초마다 자동으로 백그라운드 재조회 (로딩 표시 X)
    useEffect(() => {
        if (!selectedDeviceId) return;
        const interval = setInterval(() => {
            fetchData(false);
        }, AUTO_REFRESH_MS);
        return () => clearInterval(interval);
    }, [fetchData, selectedDeviceId]);

    const handleResolveError = async (errorId: number) => {
        await resolveDeviceError(errorId);
        if (selectedDeviceId) {
            const updated = await getDeviceErrors(selectedDeviceId, true);
            setErrors(updated);
        }
    };

    const handleResolveAllErrors = async () => {
        if (!selectedDeviceId) return;
        await resolveAllDeviceErrors(selectedDeviceId);
        const updated = await getDeviceErrors(selectedDeviceId, true);
        setErrors(updated);
    };

    const handleResolveAlarm = async (alarmId: number) => {
        await resolveAlarm(alarmId);
        if (selectedDeviceId) {
            const updated = await getAlarms(selectedDeviceId, true);
            setAlarms(updated);
        }
    };

    const handleResolveAllAlarms = async () => {
        if (!selectedDeviceId) return;
        await resolveAllAlarms(selectedDeviceId);
        const updated = await getAlarms(selectedDeviceId, true);
        setAlarms(updated);
    }

    return (
        <DashboardPresenter
            devices={devices}
            devicesLoaded={devicesLoaded}
            selectedDevice={selectedDevice}
            selectedMetric={selectedMetric}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            granularity={granularity}
            selectedDate={selectedDate}
            onSelectDevice={setSelectedDeviceId}
            onSelectMetric={setSelectedMetric}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            onSelectGranularity={setGranularity}
            onSelectDate={setSelectedDate}
            onSelectView={setActiveView}
            realtimeData={realtimeData}
            monthlyData={monthlyData}
            envRealtimeData={envRealtimeData}
            envMonthlyData={envMonthlyData}
            energyData={energyData}
            peakData={peakData}
            activeView={activeView}
            errors={errors}
            alarms={alarms}
            onResolveError={handleResolveError}
            onResolveAllErrors={handleResolveAllErrors}
            onResolveAlarm={handleResolveAlarm}
            onResolveAllAlarms={handleResolveAllAlarms}
            loading={loading}
            error={error}
        />
    );
}