import type { Device, Metric, SinglePhaseMeasurement, ThreePhaseMeasurement, MonthlyPoint, PeakPoint, DeviceError } from "@/lib/types";
import DeviceSelector from "./DeviceSelector";
import MetricDropdown from "./MetricDropdown";
import DeviceStatusBadge from "./DeviceStatusBadge";
import RealtimeChart from "./RealtimeChart";
import MonthlyChart from "./MonthlyChart";
import Peak15minChart from "./Peak15minChart";
import ErrorLogPanel from "./ErrorLogPanel";

interface DashboardPresenterProps {
    devices: Device[];
    selectedDevice: Device | null;
    selectedMetric: Metric;
    onSelectDevice: (deviceId: string) => void;
    onSelectMetric: (metric: Metric) => void;
    realtimeData: (SinglePhaseMeasurement | ThreePhaseMeasurement)[];
    monthlyData: MonthlyPoint[];
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
    onSelectDevice,
    onSelectMetric,
    realtimeData,
    monthlyData,
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
                    {selectedDevice && <DeviceStatusBadge device={selectedDevice} unresolvedErrors={errors} />}
                </div>
            </div>
            {error && <p className="text-red-600 text-sm">에러: {error}</p>}
            {loading && <p className="text-gray-500 text-sm">불러오는 중...</p>}

            {selectedDevice && !loading && (
                <>
                    <section>
                        <h2 className="text-lg font-semibold mb-2">실시간 그래프</h2>
                        <RealtimeChart device={selectedDevice} metric={selectedMetric} data={realtimeData} />
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-2">월별 그래프</h2>
                        <MonthlyChart data={monthlyData} />
                    </section>

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
