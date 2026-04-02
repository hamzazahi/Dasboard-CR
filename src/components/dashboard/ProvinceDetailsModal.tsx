"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    Users,
    ClipboardList,
    MapPin,
    Activity,
    Lightbulb,
    TrendingUp,
} from "lucide-react";

interface ProvinceData {
    name: string;
    amount: number; // Screenings
    value: number; // % Share
    userCount?: number;
    topScreeningType?: string;
    topScreeningCount?: number;
}

interface ProvinceDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    provinces: ProvinceData[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

export default function ProvinceDetailsModal({
    open,
    onOpenChange,
    provinces
}: ProvinceDetailsModalProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const provincesWithData = provinces.filter(p => p.name !== 'Unknown');

    if (provincesWithData.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>National Screening Overview</DialogTitle>
                    </DialogHeader>
                    <div className="py-20 text-center text-muted-foreground">
                        No provincial data available.
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const totalScreenings = provincesWithData.reduce((sum, p) => sum + p.amount, 0);
    const totalUsers = provincesWithData.reduce((sum, p) => sum + (p.userCount || 0), 0);
    const avgPerProvince = Math.round(totalScreenings / provincesWithData.length);
    const topProvince = [...provincesWithData].sort((a, b) => b.amount - a.amount)[0];

    const chartData = provincesWithData.slice(0, 10).map(p => ({
        name: p.name,
        screenings: p.amount,
        users: p.userCount || 0
    }));

    const pieData = provincesWithData.map(p => ({
        name: p.name,
        value: p.amount
    }));

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
            <div className="relative z-10 w-[95vw] max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 relative flex items-center">
                    <button 
                        onClick={() => onOpenChange(false)} 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white mr-4"
                    >
                        ✕
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">National Screening Overview</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Comprehensive Analysis & Insights</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar" style={{ maxHeight: '70vh' }}>
                    {/* Summary Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-[11px] font-medium text-slate-500 mb-2">Total Screenings</div>
                                <div className="text-3xl font-bold text-emerald-500 mb-1">{totalScreenings >= 1000 ? `${(totalScreenings/1000).toFixed(1)}K` : totalScreenings}</div>
                                <div className="text-[10px] text-slate-400">All provinces</div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-[11px] font-medium text-slate-500 mb-2">Active Participants</div>
                                <div className="text-3xl font-bold text-emerald-500 mb-1">{totalUsers >= 1000 ? `${(totalUsers/1000).toFixed(1)}K` : totalUsers}</div>
                                <div className="text-[10px] text-slate-400">Total individuals</div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-[11px] font-medium text-slate-500 mb-2">Provinces Covered</div>
                                <div className="text-3xl font-bold text-orange-500 mb-1">{provincesWithData.length}</div>
                                <div className="text-[10px] text-slate-400">Of 9 total</div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-100 dark:border-slate-800 shadow-none bg-white dark:bg-slate-900/50">
                            <CardContent className="p-6 text-center">
                                <div className="text-[11px] font-medium text-slate-500 mb-2">Avg per Province</div>
                                <div className="text-3xl font-bold text-blue-500 mb-1">{avgPerProvince}</div>
                                <div className="text-[10px] text-slate-400">Average screenings</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-transparent border-b border-slate-100 dark:border-slate-800 w-full justify-start rounded-none h-auto p-0 gap-6">
                            <TabsTrigger 
                                value="overview" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all"
                            >
                                📊 Overview
                            </TabsTrigger>
                            <TabsTrigger 
                                value="details" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2 text-sm font-medium flex items-center gap-2 text-slate-500"
                            >
                                🗺️ Province Details
                            </TabsTrigger>
                            <TabsTrigger 
                                value="conditions" 
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2 text-sm font-medium flex items-center gap-2 text-slate-500"
                            >
                                🏥 Health Conditions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-6 space-y-6">
                            <div className="grid lg:grid-cols-2 gap-6">
                                <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-slate-500">
                                            Top Provinces (by volume)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full mt-4 overflow-hidden">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-[10px] font-bold text-slate-400" />
                                                    <YAxis axisLine={false} tickLine={false} className="text-[10px] font-bold text-slate-400" />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '700' }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="screenings" fill="#10b981" radius={[4, 4, 0, 0]} name="Screenings" barSize={32} />
                                                    <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Users" barSize={32} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-slate-500">
                                            Screening Distribution
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                        label={({ name, value }) => `${name}: ${value}`}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '700' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border-none bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mt-6">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Lightbulb className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-black text-slate-800 dark:text-slate-200">National Health Insights</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-900 dark:text-slate-100">Geographic Reach:</span> Program is active in {provincesWithData.length} provinces, engaging {totalUsers.toLocaleString()} participants nationwide.
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-900 dark:text-slate-100">Leading Province:</span> {topProvince.name} leads with {topProvince.amount.toLocaleString()} screenings ({topProvince.value}% of national total).
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-900 dark:text-slate-100">Health Alert:</span> {topProvince.topScreeningType || "Multiple indicators"} identified as prevalent in {topProvince.name}.
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    <span className="text-slate-900 dark:text-slate-100">Platform Activity:</span> {totalScreenings.toLocaleString()} total assessments completed to date.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details" className="mt-6">
                            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                        <TableRow>
                                            <TableHead className="font-bold">Province</TableHead>
                                            <TableHead className="text-right font-bold">Screenings</TableHead>
                                            <TableHead className="text-right font-bold">Active Users</TableHead>
                                            <TableHead className="text-right font-bold">Top Condition</TableHead>
                                            <TableHead className="text-right font-bold">% Share</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {provincesWithData.map((province, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                <TableCell className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter text-xs">{province.name}</TableCell>
                                                <TableCell className="text-right font-black text-xs">{province.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary" className="font-black text-[10px]">{province.userCount || 0}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-[10px] font-bold text-slate-500 italic max-w-[150px] truncate">
                                                    {province.topScreeningType || "N/A"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Progress value={province.value} className="w-16 h-1.5 bg-slate-100" />
                                                        <span className="text-[10px] font-black text-slate-400 w-8">{province.value}%</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>

                        <TabsContent value="conditions" className="mt-6 space-y-6">
                            <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-rose-500" />
                                        Primary Health Risks by Region
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium">
                                        Dominant health concerns detected through screening protocols in each province.
                                    </CardDescription>
                                </CardHeader>
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                        <TableRow>
                                            <TableHead className="font-bold">Province</TableHead>
                                            <TableHead className="text-right font-bold">Top Condition</TableHead>
                                            <TableHead className="text-right font-bold">Cases</TableHead>
                                            <TableHead className="text-right font-bold">Prevalence</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {provincesWithData.map((province, idx) => {
                                            const prevalence = province.amount > 0 ? Math.round(((province.topScreeningCount || 0) / province.amount) * 100) : 0;
                                            return (
                                                <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter text-xs">{province.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-xs font-black text-primary uppercase tracking-tight">{province.topScreeningType || "N/A"}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className="text-rose-600 border-rose-200 font-black text-[10px]">
                                                            {province.topScreeningCount || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <Progress value={prevalence} className="w-16 h-1.5 bg-rose-50" />
                                                            <span className="text-[10px] font-black text-rose-500 w-8">{prevalence}%</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>,
        document.body
    );
}
