"use client"

import { useEffect, useState } from "react";
import { getLogs } from "@/lib/api";

export default function SystemLogPanel() {
    const [lines, setLines] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getLogs(200)
            .then((res) => setLines(res.lines))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const filteredLines = search
        ? lines.filter((line) => line.toLowerCase().includes(search.toLowerCase()))
        : lines;

    return (
        <div>
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
