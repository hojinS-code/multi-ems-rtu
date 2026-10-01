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

function diffMinutes(start: string, end: string): number {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function formatMinutes(minutes: number): string {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const remainMinutes = minutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (remainMinutes > 0 || parts.length === 0) parts.push(`${remainMinutes}분`);
    return parts.join(" ");
}

function formatDuration(start: string, end: string): string {
    const minutes = diffMinutes(start, end);
    return formatMinutes(minutes);
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
    const upSegments = segments.filter((s) => s.status === "up");

    const upMinutes = upSegments.reduce((sum, s) => sum + diffMinutes(s.start, s.end), 0);
    const downMinutes = downSegments.reduce((sum, s) => sum + diffMinutes(s.start, s.end), 0);

    return (
        <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                    {segments.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-[var(--foreground-muted)]">가동 시간</p>
                                <p className="text-lg font-semibold text-[var(--foreground)]">{formatMinutes(upMinutes)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--foreground-muted)]">연결 끊김</p>
                                <p className="text-lg font-semibold text-[var(--status-critical)]">
                                    {formatMinutes(downMinutes)} ({downSegments.length}건)
                                </p>
                            </div>
                        </div>
                    )}

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