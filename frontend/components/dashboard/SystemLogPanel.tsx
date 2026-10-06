"use client"

import { useEffect, useState } from "react";
import { getLogs } from "@/lib/api";
import type { Device, DeviceType } from "@/lib/types"

interface SystemLogPanelProps {
    devices: Device[];
}

type LogTab = "all" | "single_phase" | "three_phase_3w" | "three_phase_4w" | "environment";

const TAB_LABELS: Record<LogTab, string> = {
    all: "전체",
    single_phase: "단상",
    three_phase_3w: "3상3선",
    three_phase_4w: "3상4선",
    environment: "온습도조도계",
};

export default function SystemLogPanel({ devices }: SystemLogPanelProps) {
    const [lines, setLines] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<LogTab>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getLogs(200)
            .then((res) => setLines(res.lines))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const idsByType = (tab: LogTab): number[] => {
        if (tab === "single_phase") {
            return devices.filter((d) => d.device_type === "single_phase").map((d) => d.id);
        }
        if (tab === "three_phase_3w") {
            return devices.filter((d) => d.device_type === "three_phase" && d.wiring === "3W").map((d) => d.id);
        }
        if (tab === "three_phase_4w") {
            return devices.filter((d) => d.device_type === "three_phase" && d.wiring === "4W").map((d) => d.id);
        }
        if (tab === "environment") {
            return devices.filter((d) => d.device_type === "environment").map((d) => d.id);
        }
        return [];
    };


    const tabFilteredLines =
        activeTab === "all"
            ? lines
            : lines.filter((line) =>
                idsByType(activeTab).some((id) => line.includes(`device_id=${id}`))
            );

    const filteredLines = search
        ? tabFilteredLines.filter((line) => line.toLowerCase().includes(search.toLowerCase()))
        : tabFilteredLines;

    const tabs: LogTab[] = ["all", "single_phase", "three_phase_3w", "three_phase_4w", "environment"];

    return (
        <div>
            <div className="mb-3">
                <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as LogTab)}
                    className="border border-[var(--border)] rounded px-2 py-1.5 text-sm bg-[var(--surface)] min-w-0 max-w-full"
                >
                    {tabs.map((tab) => (
                        <option key={tab} value={tab}>
                            {TAB_LABELS[tab]}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="로그 검색 (예: device_id=1, ERROR, COM3)"
                    className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--surface)]"
                />
            </div>

            {loading && <p className="text-sm text-[var(--foreground-muted)]">불러오는 중...</p>}
            {error && <p className="text-sm text-[var(--status-critical)]">에러: {error}</p>}

            {!loading && !error && (
                <div className="bg-[#1e1e1e] rounded p-3 overflow-auto max-h-[60vh]">
                    <pre className="text-xs text-[#d4d4d4] whitespace-pre-wrap break-all font-mono">
                        {filteredLines.length > 0
                            ? filteredLines.join("\n")
                            : "검색 결과가 없습니다."}
                    </pre>
                </div>
            )}
        </div>
    );
}
