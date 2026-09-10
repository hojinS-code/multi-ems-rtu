"use client";

import type { DeviceType } from "@/lib/types";

interface MetricTreeProps {
    deviceType: DeviceType;
    selectedMetric: string;
    onSelect: (metric: string) => void;
}

interface MetricNode {
    key: string;
    label: string;
    children?: { key: string; label: string }[];
}

const THREE_PHASE_TREE: MetricNode[] = [
    {
        key: "voltage",
        label: "전압",
        children: [
            { key: "voltage_l1", label: "전압1" },
            { key: "voltage_l2", label: "전압2" },
            { key: "voltage_l3", label: "전압3" },
        ],
    },
    {
        key: "current",
        label: "전류",
        children: [
            { key: "current_l1", label: "전류1" },
            { key: "current_l2", label: "전류2" },
            { key: "current_l3", label: "전류3" },
        ],
    },
];

const ENV_TREE: MetricNode[] = [
    {
        key: "temperature",
        label: "온습도",
        children: [
            { key: "temperature", label: "온도" },
            { key: "humidity", label: "습도" },
            { key: "illuminance", label: "조도" },
        ],
    },
];

export default function MetricTree({ deviceType, selectedMetric, onSelect }: MetricTreeProps) {
    if (deviceType === "single_phase") {
        return null;
    }

    const tree = deviceType === "environment" ? ENV_TREE : THREE_PHASE_TREE;

    return (
        <nav className="space-y-1">
            {tree.map((node) => (
                <div key={node.key}>
                    <button
                        onClick={() => onSelect(node.key)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm ${selectedMetric === node.key
                            ? "bg-[var(--accent)] text-white font-medium"
                            : "text-[var(--foreground)] hover:bg-[var(--background)]"
                            }`}
                    >
                        {node.label}
                    </button>
                    {node.children && (
                        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
                            {node.children.map((child) => (
                                <button
                                    key={child.key}
                                    onClick={() => onSelect(child.key)}
                                    className={`w-full text-left px-2 py-1 rounded text-sm ${selectedMetric === child.key
                                        ? "bg-[var(--accent)] text-white font-medium"
                                        : "text-[var(--foreground-muted)] hover:bg-[var(--background)]"
                                        }`}
                                >
                                    {child.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}