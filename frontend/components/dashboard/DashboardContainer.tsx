"use client";

import { useState, useEffect } from "react";
import type { Device, Metric, SinglePhaseMeasurement, ThreePhaseMeasurement, MonthlyPoint, PeakPoint, DeviceError } from "@/lib/types";
import {
    getDevices,
    getRealtimeMeasurements,
    getMonthlyMeasurements,
    getPeak15min,
    getDeviceErrors,
    resolveDeviceError,
} from "@/lib/api";
import DashboardPresenter from "./DashboardPresenter";

export default function DashboardContainer() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<Metric>("voltage");

    const [realtimeData, setRealtimeData] = useState<(SinglePhaseMeasurement | ThreePhaseMeasurement)[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
    const [peakData, setPeakData] = useState<PeakPoint[]>([]);
    const [errors, setErrors] = useState<DeviceError[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            .catch((e) => setError(e.message));
    }, []);

    //선택된 장비/지표가 바뀔 때마다 데이터 재조회
    useEffect(() => {
        if (!selectedDeviceId) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const today = now.toISOString().slice(0, 10);

        setLoading(true);
        setError(null);

        Promise.all([
            getRealtimeMeasurements(selectedDeviceId, selectedMetric, 30),
            getMonthlyMeasurements(selectedDeviceId, selectedMetric, year, month),
            getPeak15min(selectedDeviceId, today),
            getDeviceErrors(selectedDeviceId, true),
        ])
            .then(([realtime, monthly, peak, deviceErrors]) => {
                setRealtimeData(realtime);
                setMonthlyData(monthly);
                setPeakData(peak);
                setErrors(deviceErrors);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [selectedDeviceId, selectedMetric]);

    const handleResolveError = async (errorId: string) => {
        await resolveDeviceError(errorId);
        if (selectedDeviceId) {
            const updated = await getDeviceErrors(selectedDeviceId, true);
            setErrors(updated);
        }
    };

    return (
        <DashboardPresenter
            devices={devices}
            selectedDevice={selectedDevice}
            selectedMetric={selectedMetric}
            onSelectDevice={setSelectedDeviceId}
            onSelectMetric={setSelectedMetric}
            realtimeData={realtimeData}
            monthlyData={monthlyData}
            peakData={peakData}
            errors={errors}
            onResolveError={handleResolveError}
            loading={loading}
            error={error}
        />
    );
}