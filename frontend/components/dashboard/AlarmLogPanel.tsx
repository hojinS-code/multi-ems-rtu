"use client";

import { useState } from "react";
import type { Alarm } from "@/lib/types";

interface AlarmLogPanelProps {
    alarms: Alarm[];
    onResolve: (alarmId: string) => Promise<void>;
}

const ALARM_TYPE_LABELS: Record<Alarm["alarm_type"], string> = {
    over_voltage: "과전압",
    under_voltage: "저전압",
    over_current: "과전류",
    over_power: "과전력",
    phase_imbalance: "상간 불평형",
};

const SEVERITY_LABELS: Record<Alarm["severity"], string> = {
    warning: "경고",
    critical: "오류",
};

const SEVERITY_STYLES: Record<Alarm["severity"], string> = {
    warning: "bg-[var(--status-warning)] text-white",
    critical: "bg-[var(--status-critical)] text-white",
};

function formatDateTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AlarmLogPanel({ alarms, onResolve }: AlarmLogPanelProps) {
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    if (alarms.length === 0) {
        return <p className="text-sm text-[var(--foreground-muted)]">현재 미해결 알람이 없습니다.</p>
    }

    const handleResolve = async (alarmId: string) => {
        setResolvingId(alarmId);
        try {
            await onResolve(alarmId);
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <ul className="divide-y divide-[var(--border)]">
            {alarms.map((alarm) => (
                <li key={alarm.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${SEVERITY_STYLES[alarm.severity]}`}>
                            {SEVERITY_LABELS[alarm.severity]}
                        </span>
                        <span className="font-medium">{ALARM_TYPE_LABELS[alarm.alarm_type]}</span>
                        <span className="text-[var(--foreground-muted)] ml-2">{formatDateTime(alarm.occurred_at)}</span>
                        <p className="text-[var(--foreground-muted)]">{alarm.message}</p>
                    </div>
                    <button
                        onClick={() => handleResolve(alarm.id)}
                        disabled={resolvingId === alarm.id}
                        className="rounded border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--background)] disabled:opacity-50"
                    >
                        {resolvingId === alarm.id ? "처리 중..." : "해결 처리"}
                    </button>
                </li>
            ))}
        </ul>
    );
}