"use client";

export type DashboardView = "realtime" | "monthly" | "peak" | "errors" | "alarms" | "logs";

interface ViewMenuProps {
    activeView: DashboardView;
    onSelect: (view: DashboardView) => void;
    showPeak: boolean;
    errorCount: number;
    alarmCount: number;
}

export default function ViewMenu({ activeView, onSelect, showPeak, errorCount, alarmCount }: ViewMenuProps) {
    const items: { key: DashboardView; label: string; count?: number }[] = [
        { key: "realtime", label: "실시간 그래프" },
        { key: "monthly", label: "월별 그래프" },
    ];
    if (showPeak) {
        items.push({ key: "peak", label: "15분 피크전력" });
    }
    items.push({ key: "errors", label: "미해결 에러", count: errorCount });
    items.push({ key: "alarms", label: "미해결 알람", count: alarmCount });
    items.push({ key: "logs", label: "시스템 로그" });

    return (
        <nav className="space-y-1">
            {items.map((item) => (
                <button
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    className={`flex w-full items-center justify-between px-2 py-1.5 rounded text-sm text-left ${activeView === item.key
                        ? "bg-[var(--accent)] text-white font-medium"
                        : "text-[var(--foreground)] hover:bg-[var(--background)]"
                        }`}
                >
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                        <span className="ml-2 rounded-full bg-[var(--status-critical)] px-1.5 text-xs text-white">
                            {item.count}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
}