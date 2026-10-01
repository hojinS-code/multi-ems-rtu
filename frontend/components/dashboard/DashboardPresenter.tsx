import { useEffect } from "react";
import type { Device, Metric, EnvMetric, SinglePhaseMeasurement, ThreePhaseMeasurement, MonthlyPoint, MonthlyPhasePoint, PeakPoint, DeviceError, EnvironmentMeasurement, EnvironmentMonthlyPoint, Alarm } from "@/lib/types";
import type { EnergyResponse } from "@/lib/api";
import DeviceSelector from "./DeviceSelector";
import DeviceIdList from "./DeviceIdList";
import MetricDropdown from "./MetricDropdown";
import MetricTree from "./MetricTree";
import DeviceStatusBadge from "./DeviceStatusBadge";
import RealtimeChart from "./RealtimeChart";
import MonthlyChart from "./MonthlyChart";
import Peak15minChart from "./Peak15minChart";
import EnergyChart from "./EnergyChart";
import ErrorLogPanel from "./ErrorLogPanel";
import AlarmLogPanel from "./AlarmLogPanel";
import UptimePanel from "./UptimePanel";
import ViewMenu from "./ViewMenu";
import type { DashboardView } from "./ViewMenu";
import SystemLogPanel from "./SystemLogPanel";
import { EnvironmentRealtimeChart, EnvironmentMonthlyChart } from "./EnvironmentChart";

interface DashboardPresenterProps {
    devices: Device[];
    selectedDevice: Device | null;
    selectedMetric: string;
    selectedYear: number;
    selectedMonth: number;
    granularity: "day" | "hour" | "minute";
    selectedDate: string;
    activeView: DashboardView;
    onSelectDevice: (deviceId: number) => void;
    onSelectMetric: (metric: string) => void;
    onSelectYear: (year: number) => void;
    onSelectMonth: (month: number) => void;
    onSelectGranularity: (granularity: "day" | "hour" | "minute") => void;
    onSelectDate: (date: string) => void;
    onSelectView: (view: DashboardView) => void;
    realtimeData: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
    monthlyData: (MonthlyPoint | MonthlyPhasePoint)[];
    envRealtimeData: EnvironmentMeasurement[];
    envMonthlyData: EnvironmentMonthlyPoint[];
    energyData: EnergyResponse | null;
    peakData: PeakPoint[];
    errors: DeviceError[];
    alarms: Alarm[];
    onResolveError: (errorId: number) => Promise<void>;
    onResolveAllErrors: () => Promise<void>;
    onResolveAlarm: (alarmId: number) => Promise<void>;
    onResolveAllAlarms: () => Promise<void>;
    loading: boolean;
    error: string | null;
}

const CARD = "bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 min-w-0";
const SELECT = "border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]";
const TITLE = "text-sm font-semibold text-[var(--foreground-muted)]";

export default function DashboardPresenter({
    devices,
    selectedDevice,
    selectedMetric,
    selectedYear,
    selectedMonth,
    granularity,
    selectedDate,
    activeView,
    onSelectDevice,
    onSelectMetric,
    onSelectYear,
    onSelectMonth,
    onSelectGranularity,
    onSelectDate,
    onSelectView,
    realtimeData,
    monthlyData,
    envRealtimeData,
    envMonthlyData,
    energyData,
    peakData,
    errors,
    alarms,
    onResolveError,
    onResolveAllErrors,
    onResolveAlarm,
    onResolveAllAlarms,
    loading,
    error,
}: DashboardPresenterProps) {
    const isEnvironment = selectedDevice?.device_type === "environment";

    //온습도조도계에는 15분 피크 화면이 없으므로, 그 화면을 보고 있었다면 실시간으로 되돌린다
    useEffect(() => {
        if (isEnvironment && activeView === "peak") {
            onSelectView("realtime");
        }
    }, [isEnvironment, activeView, onSelectView]);

    const periodControls = (
        <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedYear} onChange={(e) => onSelectYear(Number(e.target.value))} className={SELECT}>
                {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}년</option>
                ))}
            </select>
            <select value={selectedMonth} onChange={(e) => onSelectMonth(Number(e.target.value))} className={SELECT}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}월</option>
                ))}
            </select>
            <select
                value={granularity}
                onChange={(e) => onSelectGranularity(e.target.value as "day" | "hour" | "minute")}
                className={SELECT}
            >
                <option value="day">일 단위</option>
                <option value="hour">시간 단위</option>
                <option value="minute">분 단위</option>
            </select>
            {granularity !== "day" && (
                <input type="date" value={selectedDate} onChange={(e) => onSelectDate(e.target.value)} className={SELECT} />
            )}
        </div>
    );

    const renderContent = () => {
        if (!selectedDevice) return null;

        // 전력량 지표는 메뉴와 관계업이 전력량 카드 하나만 보여준다
        if (!isEnvironment && selectedMetric === "energy") {
            return (
                <section className={CARD}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h2 className={TITLE}>전력량 (kWh)</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <MetricDropdown
                                deviceType={selectedDevice.device_type}
                                selectedMetric={selectedMetric}
                                onSelect={onSelectMetric}
                            />
                            <select value={selectedYear} onChange={(e) => onSelectYear(Number(e.target.value))} className={SELECT}>
                                {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((y) => (
                                    <option key={y} value={y}>{y}년</option>
                                ))}
                            </select>
                            <select value={selectedMonth} onChange={(e) => onSelectMonth(Number(e.target.value))} className={SELECT}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{m}월</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {energyData && <EnergyChart data={energyData} />}
                </section>
            );
        }

        if (activeView === "realtime") {
            return (
                <section className={CARD}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h2 className={TITLE}>실시간 그래프</h2>
                        <MetricDropdown
                            deviceType={selectedDevice.device_type}
                            selectedMetric={selectedMetric}
                            onSelect={onSelectMetric}
                        />
                    </div>
                    {isEnvironment ? (
                        <EnvironmentRealtimeChart metric={selectedMetric as EnvMetric} data={envRealtimeData} />
                    ) : (
                        <RealtimeChart device={selectedDevice} metric={selectedMetric as Metric} data={realtimeData} />
                    )}
                </section>
            );
        }

        if (activeView === "monthly") {
            return (
                <section className={CARD}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h2 className={TITLE}>월별 그래프</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <MetricDropdown
                                deviceType={selectedDevice.device_type}
                                selectedMetric={selectedMetric}
                                onSelect={onSelectMetric}
                            />
                            {periodControls}
                        </div>
                    </div>
                    {isEnvironment ? (
                        <EnvironmentMonthlyChart data={envMonthlyData} granularity={granularity} />
                    ) : (
                        <MonthlyChart device={selectedDevice} metric={selectedMetric as Metric} data={monthlyData} granularity={granularity} />
                    )}
                </section>
            );
        }

        if (activeView === "peak" && !isEnvironment) {
            return (
                <section className={CARD}>
                    <h2 className={`${TITLE} mb-3`}>15분 피크전력량 (유효전력 기준)</h2>
                    <Peak15minChart data={peakData} />
                </section>
            );
        }

        if (activeView === "errors") {
            return (
                <section className={CARD}>
                    <h2 className={`${TITLE} mb-3`}>미해결 에러</h2>
                    <ErrorLogPanel errors={errors} onResolve={onResolveError} onResolveAll={onResolveAllErrors} />
                </section>
            );
        }

        if (activeView === "alarms") {
            return (
                <section className={CARD}>
                    <h2 className={`${TITLE} mb-3`}>미해결 알람</h2>
                    <AlarmLogPanel alarms={alarms} onResolve={onResolveAlarm} onResolveAll={onResolveAllAlarms} />
                </section>
            );
        }

        if (activeView === "logs") {
            return (
                <section className={CARD}>
                    <h2 className={`${TITLE} mb-3`}>시스템 로그</h2>
                    <SystemLogPanel devices={devices} />
                </section>
            );
        }

        if (activeView === "uptime") {
            return (
                <section className={CARD}>
                    <h2 className={`${TITLE} mb-3`}>이력 조회</h2>
                    <UptimePanel deviceId={selectedDevice.id} />
                </section>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
            <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
                <h1 className="text-xl font-bold text-[var(--foreground)]">Multi-EMS-RTU 대시보드</h1>
            </header>

            <div className="flex min-w-0">
                {/* 왼쪽 사이드바 */}
                <aside className="basis-64 min-w-[160px] w-0 shrink border-r border-[var(--border)] bg-[var(--surface)] p-5 space-y-6 sticky top-0 self-start h-screen overflow-y-auto">
                    <div>
                        <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">장비 선택</p>
                        <DeviceSelector devices={devices} selectedDeviceId={selectedDevice?.id ?? null} onSelect={onSelectDevice} />
                        {selectedDevice && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                <DeviceStatusBadge device={selectedDevice} unresolvedErrors={errors} />
                                {selectedDevice.wiring && (
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent)] text-white">
                                        {selectedDevice.wiring === "3W" ? "3상3선" : "3상4선"}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedDevice && (
                        <div>
                            <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">화면</p>
                            <ViewMenu
                                activeView={activeView}
                                onSelect={onSelectView}
                                showPeak={!isEnvironment}
                                errorCount={errors.length}
                                alarmCount={alarms.length}
                            />
                        </div>
                    )}

                    {selectedDevice && (
                        <div>
                            <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">장비 ID</p>
                            <DeviceIdList
                                devices={devices.filter(
                                    (d) => d.device_type === selectedDevice.device_type && d.wiring === selectedDevice.wiring
                                )}
                                selectedDeviceId={selectedDevice?.id ?? null}
                                onSelect={onSelectDevice}
                            />
                        </div>
                    )}
                </aside>

                {/* 오른쪽 메인 영역 */}
                <main className="flex-1 min-w-0 p-6 space-y-6">
                    {error && <p className="text-[var(--status-critical)] text-sm">에러: {error}</p>}
                    <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}