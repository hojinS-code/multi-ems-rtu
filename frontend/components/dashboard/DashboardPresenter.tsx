import type { Device, Metric, SinglePhaseMeasurement, ThreePhaseMeasurement, MonthlyPoint, MonthlyPhasePoint, PeakPoint, DeviceError } from "@/lib/types";
import type { EnergyResponse } from "@/lib/api";
import DeviceSelector from "./DeviceSelector";
import MetricDropdown from "./MetricDropdown";
import DeviceStatusBadge from "./DeviceStatusBadge";
import RealtimeChart from "./RealtimeChart";
import MonthlyChart from "./MonthlyChart";
import Peak15minChart from "./Peak15minChart";
import EnergyChart from "./EnergyChart";
import ErrorLogPanel from "./ErrorLogPanel";

interface DashboardPresenterProps {
    devices: Device[];
    selectedDevice: Device | null;
    selectedMetric: Metric;
    selectedYear: number;
    selectedMonth: number;
    granularity: "day" | "hour" | "minute";
    selectedDate: string;
    onSelectDevice: (deviceId: string) => void;
    onSelectMetric: (metric: Metric) => void;
    onSelectYear: (year: number) => void;
    onSelectMonth: (month: number) => void;
    onSelectGranularity: (granularity: "day" | "hour" | "minute") => void;
    onSelectDate: (date: string) => void;
    realtimeData: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
    monthlyData: (MonthlyPoint | MonthlyPhasePoint)[];
    energyData: EnergyResponse | null;
    peakData: PeakPoint[];
    errors: DeviceError[];
    onResolveError: (errorId: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export default function DashboardPresenter({
    devices,
    selectedDevice,
    selectedMetric,
    selectedYear,
    selectedMonth,
    granularity,
    selectedDate,
    onSelectDevice,
    onSelectMetric,
    onSelectYear,
    onSelectMonth,
    onSelectGranularity,
    onSelectDate,
    realtimeData,
    monthlyData,
    energyData,
    peakData,
    errors,
    onResolveError,
    loading,
    error,
}: DashboardPresenterProps) {
    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 bg-white text-black min-h-screen">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Multi-EMS-RTU 대시보드</h1>

                <div className="flex items-center gap-3">
                    <DeviceSelector devices={devices} selectedDeviceId={selectedDevice?.id ?? null} onSelect={onSelectDevice} />
                    <MetricDropdown selectedMetric={selectedMetric} onSelect={onSelectMetric} />

                    <select
                        value={selectedYear}
                        onChange={(e) => onSelectYear(Number(e.target.value))}
                        className="border rounded px-3 py-2 text-sm text-black bg-white"
                    >
                        {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((y) => (
                            <option key={y} value={y}>{y}년</option>
                        ))}
                    </select>

                    <select
                        value={selectedMonth}
                        onChange={(e) => onSelectMonth(Number(e.target.value))}
                        className="border rounded px-3 py-2 text-sm text-black bg-white"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>{m}월</option>
                        ))}
                    </select>

                    {selectedMetric !== "energy" && (
                        <select
                            value={granularity}
                            onChange={(e) => onSelectGranularity(e.target.value as "day" | "hour" | "minute")}
                            className="border rounded px-3 py-2 text-sm text-black bg-white"
                        >
                            <option value="day">일 단위</option>
                            <option value="hour">시간 단위</option>
                            <option value="minute">분 단위</option>
                        </select>
                    )}

                    {selectedMetric !== "energy" && granularity !== "day" && (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => onSelectDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm text-black bg-white"
                        />
                    )}

                    {selectedDevice && <DeviceStatusBadge device={selectedDevice} unresolvedErrors={errors} />}
                </div>
            </div>
            {error && <p className="text-red-600 text-sm">에러: {error}</p>}
            {loading && <p className="text-gray-500 text-sm">불러오는 중...</p>}

            {selectedDevice && !loading && (
                <>
                    {selectedMetric === "energy" ? (
                        <section>
                            <h2 className="text-lg font-semibold mb-2">전력량 (kWh)</h2>
                            {energyData && <EnergyChart data={energyData} />}
                        </section>
                    ) : (
                        <>
                            <section>
                                <h2 className="text-lg font-semibold mb-2">실시간 그래프</h2>
                                <RealtimeChart device={selectedDevice} metric={selectedMetric} data={realtimeData} />
                            </section>

                            <section>
                                <h2 className="text-lg font-semibold mb-2">월별 그래프</h2>
                                <MonthlyChart device={selectedDevice} metric={selectedMetric} data={monthlyData} />
                            </section>
                        </>
                    )}
                    <section>
                        <h2 className="text-lg font-semibold mb-2">15분 피크전력량 (유효전력 기준)</h2>
                        <Peak15minChart data={peakData} />
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">미해결 에러</h2>
                        <ErrorLogPanel errors={errors} onResolve={onResolveError} />
                    </section>
                </>
            )}
        </div>
    );
}