"use client";

import { useState } from "react";
import type { DeviceError } from "@/lib/types";

interface ErrorLogPanelProps {
    errors: DeviceError[];
    onResolve: (errorId: string) => Promise<void>;
}

const ERROR_TYPE_LABELS: Record<DeviceError["error_type"], string> = {
    connection_failed: "연결 실패",
    read_failed: "읽기 실패",
    unknown_device_type: "알 수 없는 장비 유형",
};

function formatDateTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ErrorLogPanel({ errors, onResolve }: ErrorLogPanelProps) {
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    if (errors.length === 0) {
        return <p className="text-sm text-gray-500">현재 미해결 에러가 없습니다.</p>;
    }

    const handleResolve = async (errorId: string) => {
        setResolvingId(errorId);
        try {
            await onResolve(errorId);
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <ul className="divide-y divide-gray-200">
            {errors.map((err) => (
                <li key={err.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                        <span className="font-medium">{ERROR_TYPE_LABELS[err.error_type]}</span>
                        <span className="text-gray-500 ml-2">{formatDateTime(err.occurred_at)}</span>
                        <p className="text-gray-600">{err.message}</p>
                    </div>
                    <button
                        onClick={() => handleResolve(err.id)}
                        disabled={resolvingId === err.id}
                        className="rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                    >
                        {resolvingId === err.id ? "처리 중..." : "해결 처리"}
                    </button>
                </li>
            ))}
        </ul>
    );
}