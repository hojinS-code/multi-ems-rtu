"use client";

import { useEffect, useState } from "react";
import { getUptime } from "@/lib/api";
import type { UptimeSegment } from "@/lib/api";

interface UptimePanelProps {
    deviceId: number;
}

function formatDateTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(start: string, end: string): string {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return remainMinutes > 0 ? `${hours}시간 ${remainMinutes}분` : `${hours}시간`;
}

export default function UptimePanel({ deviceId }: UptimePanelProps) {
    const today = new Date().toISOString().slice(0, 10);
    const [start, setStart] = useState(today);
    const [end, setEnd] = useState(today);
    const [segments, setSegments] = useState<UptimeSegment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getUptime(deviceId, start, end)
            .then((res) => setSegments(res.segments))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [deviceId, start, end]);

    const downSegments = segments.filter((s) => s.status === "down");

    return (
        <div>
            <div className="flex  items-center gap-2 mb-4 flex-wrap">
                <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                />
                <span className="text-sm text-[var(--foreground-muted)]">~</span>
                <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)]"
                />
            </div>

            {loading && <p className="text-sm text-[var(--foreground-muted)]">불러오는 중...</p>}
            {error && <p className="text-sm text-[var(--status-critical)]">에러: {error}</p>}

            {!loading && !error && (
                <>
                    {downSegments.length === 0 ? (
                        <p className="text-sm text-[var(--foreground-muted)]">
                            이 기간 동안 연결 끊김 이력이 없습니다.
                        </p>
                    ) : (
                        <ul className="divide-y divide-[var(--border)]">
                            {downSegments.map((seg, i) => (
                                <li key={i} className="py-2 text-sm">
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[var(--status-critical)] text-white mr-2">
                                        연결 끊김
                                    </span>
                                    <span className="text-[var(--foreground)]">
                                        {formatDateTime(seg.start)} ~ {formatDateTime(seg.end)}
                                    </span>
                                    <span className="text-[var(--foreground-muted)] ml-2">
                                        ({formatDuration(seg.start, seg.end)})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}