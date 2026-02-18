"use client";

import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsData {
    name: string;
    cpu: string;
    memory: string;
    timestamp?: string;
    window?: string;
    containers?: Array<{
        name: string;
        cpu: string;
        memory: string;
    }>;
}

interface ResourceChartProps {
    title: string;
    data: MetricsData[];
    type: 'cpu' | 'memory';
}

// Helper to parse K8s units
const parseCpu = (cpu: string | undefined) => {
    if (!cpu) return 0;
    if (cpu.endsWith('n')) return parseFloat(cpu) / 1000000;
    if (cpu.endsWith('u')) return parseFloat(cpu) / 1000;
    if (cpu.endsWith('m')) return parseFloat(cpu);
    return parseFloat(cpu) * 1000; // Assume cores if no unit
};

const parseMemory = (mem: string | undefined) => {
    if (!mem) return 0;
    if (mem.endsWith('Ki')) return parseFloat(mem) / 1024;
    if (mem.endsWith('Mi')) return parseFloat(mem);
    if (mem.endsWith('Gi')) return parseFloat(mem) * 1024;
    return parseFloat(mem) / (1024 * 1024); // Assume bytes if no unit
};

export const ResourceChart = ({ title, data, type }: ResourceChartProps) => {
    const chartData = useMemo(() => {
        return data.map(item => ({
            name: item.name,
            value: type === 'cpu' ? parseCpu(item.cpu) : parseMemory(item.memory),
            original: type === 'cpu' ? item.cpu : item.memory
        })).sort((a, b) => b.value - a.value);
    }, [data, type]);

    const unit = type === 'cpu' ? 'm' : 'Mi';
    const color = type === 'cpu' ? '#3b82f6' : '#10b981';

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title} ({unit})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.2} />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-background border rounded-md p-2 shadow-md text-xs">
                                                <p className="font-bold">{data.name}</p>
                                                <p>{type.toUpperCase()}: {data.original}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill={color}
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export const MetricsDashboard = ({ nodes, pods }: { nodes: MetricsData[], pods: MetricsData[] }) => {
    return (
        <div className="grid gap-6">
            {nodes.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    <ResourceChart title="Node CPU Usage" data={nodes} type="cpu" />
                    <ResourceChart title="Node Memory Usage" data={nodes} type="memory" />
                </div>
            )}

            {pods.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    <ResourceChart title="Pod CPU Usage" data={pods} type="cpu" />
                    <ResourceChart title="Pod Memory Usage" data={pods} type="memory" />
                </div>
            )}
        </div>
    );
};
