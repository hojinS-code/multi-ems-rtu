import type { Device, Metric, EnvMetric, SinglePhaseMeasurement, ThreePhaseMeasurement, MonthlyPoint, MonthlyPhasePoint, PeakPoint, DeviceError, EnvironmentMeasurement, EnvironmentMonthlyPoint } from "@/lib/types";
import type { EnergyResponse } from "@/lib/api";
import DeviceSelector from "./DeviceSelector";
import MetricDropdown from "./MetricDropdown";
import MetricTree from "./MetricTree";
import DeviceStatusBadge from "./DeviceStatusBadge";
import MetricReadout from "./MetricReadout";
import RealtimeChart from "./RealtimeChart";
import MonthlyChart from "./MonthlyChart";
import Peak15minChart from "./Peak15minChart";
import EnergyChart from "./EnergyChart";
import ErrorLogPanel from "./ErrorLogPanel";
import { EnvironmentRealtimeChart, EnvironmentMonthlyChart } from "./EnvironmentChart";

interface DashboardPresenterProps {
    devices: Device[];
    selectedDevice: Device | null;
    selectedMetric: string;
    selectedYear: number;
    selectedMonth: number;
    granularity: "day" | "hour" | "minute";
    selectedDate: string;
    onSelectDevice: (deviceId: string) => void;
    onSelectMetric: (metric: string) => void;
    onSelectYear: (year: number) => void;
    onSelectMonth: (month: number) => void;
    onSelectGranularity: (granularity: "day" | "hour" | "minute") => void;
    onSelectDate: (date: string) => void;
    realtimeData: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
    monthlyData: (MonthlyPoint | MonthlyPhasePoint)[];
    envRealtimeData: EnvironmentMeasurement[];
    envMonthlyData: EnvironmentMonthlyPoint[];
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
    envRealtimeData,
    envMonthlyData,
    energyData,
    peakData,
    errors,
    onResolveError,
    loading,
    error,
}: DashboardPresenterProps) {
    const isEnvironment = selectedDevice?.device_type === "environment";

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
                <h1 className="text-xl font-bold text-[var(--foreground)]">Multi-EMS-RTU 대시보드</h1>
            </header>

            <div className="flex">
                {/* 왼쪽 사이드바 */}
                <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-5 space-y-6">
                    <div>
                        <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">장비 선택</p>
                        <DeviceSelector devices={devices} selectedDeviceId={selectedDevice?.id ?? null} onSelect={onSelectDevice} />
                        {selectedDevice && (
                            <div className="mt-2">
                                <DeviceStatusBadge device={selectedDevice} unresolvedErrors={errors} />
                            </div>
                        )}
                    </div>

                    {selectedDevice && (
                        <div>
                            <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">지표 바로가기</p>
                            <MetricTree
                                deviceType={selectedDevice.device_type}
                                selectedMetric={selectedMetric}
                                onSelect={onSelectMetric}
                            />
                        </div>
                    )}
                </aside>

                {/* 오른쪽 메인 영역 */}
                <main className="flex-1 p-6 space-y-6">
                    {error && <p className="text-[var(--status-critical)] text-sm">에러: {error}</p>}
                    {loading && <p className="text-[var(--foreground-muted)] text-sm">불러오는 중...</p>}

                    {selectedDevice && !loading && (
                        <>
                            {isEnvironment ? (
                                <>
                                    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-sm font-semibold text-[var(--foreground-muted)]">실시간 그래프</h2>
                                            <MetricDropdown
                                                deviceType={selectedDevice.device_type}
                                                selectedMetric={selectedMetric}
                                                onSelect={onSelectMetric}
                                            />
                                        </div>
                                        <EnvironmentRealtimeChart metric={selectedMetric as EnvMetric} data={envRealtimeData} />
                                    </section>

                                    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-sm font-semibold text-[var(--foreground-muted)]">월별 그래프</h2>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => onSelectYear(Number(e.target.value))}
                                                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                >
                                                    {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((y) => (
                                                        <option key={y} value={y}>{y}년</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) => onSelectMonth(Number(e.target.value))}
                                                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                        <option key={m} value={m}>{m}월</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={granularity}
                                                    onChange={(e) => onSelectGranularity(e.target.value as "day" | "hour" | "minute")}
                                                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                >
                                                    <option value="day">일 단위</option>
                                                    <option value="hour">시간 단위</option>
                                                    <option value="minute">분 단위</option>
                                                </select>
                                                {granularity !== "day" && (
                                                    <input
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={(e) => onSelectDate(e.target.value)}
                                                        className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <EnvironmentMonthlyChart data={envMonthlyData} granularity={granularity} />
                                    </section>
                                </>
                            ) : selectedMetric === "energy" ? (
                                <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-sm font-semibold text-[var(--foreground-muted)]">전력량 (kWh)</h2>
                                        <div className="flex items-center gap-2">
                                            <MetricDropdown
                                                deviceType={selectedDevice.device_type}
                                                selectedMetric={selectedMetric}
                                                onSelect={onSelectMetric}
                                            />
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => onSelectYear(Number(e.target.value))}
                                                className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                            >
                                                {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((y) => (
                                                    <option key={y} value={y}>{y}년</option>
                                                ))}
                                            </select>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => onSelectMonth(Number(e.target.value))}
                                                className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                    <option key={m} value={m}>{m}월</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {energyData && <EnergyChart data={energyData} />}
                                </section>
                            ) : (
                                <>
                                    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                        <MetricReadout device={selectedDevice} metric={selectedMetric as Metric} data={realtimeData} />
                                    </section>

                                    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-sm font-semibold text-[var(--foreground-muted)]">실시간 그래프</h2>
                                            <MetricDropdown
                                                deviceType={selectedDevice.device_type}
                                                selectedMetric={selectedMetric}
                                                onSelect={onSelectMetric}
                                            />
                                        </div>
                                        <RealtimeChart device={selectedDevice} metric={selectedMetric as Metric} data={realtimeData} />
                                    </section>

                                    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-sm font-semibold text-[var(--foreground-muted)]">월별 그래프</h2>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => onSelectYear(Number(e.target.value))}
                                                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                >
                                                    {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((y) => (
                                                        <option key={y} value={y}>{y}년</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) => onSelectMonth(Number(e.target.value))}
                                                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                        <option key={m} value={m}>{m}월</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={granularity}
                                                    onChange={(e) => onSelectGranularity(e.target.value as "day" | "hour" | "minute")}
                                                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                >
                                                    <option value="day">일 단위</option>
                                                    <option value="hour">시간 단위</option>
                                                    <option value="minute">분 단위</option>
                                                </select>
                                                {granularity !== "day" && (
                                                    <input
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={(e) => onSelectDate(e.target.value)}
                                                        className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <MonthlyChart device={selectedDevice} metric={selectedMetric as Metric} data={monthlyData} granularity={granularity} />
                                    </section>
                                </>
                            )}

                            {!isEnvironment && (
                                <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                    <h2 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">15분 피크전력량 (유효전력 기준)</h2>
                                    <Peak15minChart data={peakData} />
                                </section>
                            )}

                            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
                                <h2 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">미해결 에러</h2>
                                <ErrorLogPanel errors={errors} onResolve={onResolveError} />
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}