"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    FileDown,
    Filter,
    Eye,
    Calendar,
    Activity,
    ClipboardList,
    Search
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { collection, onSnapshot, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

interface Report {
    id: string;
    userId: string;
    illnessType: string;
    riskLevel: "Low" | "Medium" | "High";
    score: number;
    timestamp: any;
}

export default function ReportsPage() {
    const { orgId } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        if (!orgId) return;

        const q = query(
            collection(db, "screening_attempts")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            // We'll filter in JS temporarily for debugging:
            const filteredDocs = snapshot.docs.filter(d => d.data().orgId === orgId);

            const reportsData = await Promise.all(filteredDocs.map(async (docSnap) => {
                const data = docSnap.data();

                return {
                    id: docSnap.id,
                    userId: data.userId || "Unknown",
                    illnessType: data.screeningType || "General",
                    riskLevel: data.result?.likelihoodCategory || "Low",
                    score: Math.round(data.score || data.result?.normalizedScore || 0),
                    timestamp: data.completedAt
                };
            })) as Report[];

            // Sort client-side to bypass needing a new Firestore composite index
            reportsData.sort((a, b) => {
                const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (new Date(a.timestamp || 0)).getTime();
                const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (new Date(b.timestamp || 0)).getTime();
                return timeB - timeA;
            });

            setReports(reportsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.illnessType.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (startDate || endDate) {
            const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp || null);
            if (rDate && !isNaN(rDate.getTime())) {
                const rTime = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()).getTime();
                const sTime = startDate ? new Date(startDate).getTime() : -Infinity;
                const eTime = endDate ? new Date(endDate).getTime() : Infinity;
                matchesDate = rTime >= sTime && rTime <= eTime;
            }
        }

        return matchesSearch && matchesDate;
    });

    const getRiskBadge = (level: string) => {
        switch (level) {
            case "Low":
                return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none">Low Risk</Badge>;
            case "Medium":
                return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none">Medium Risk</Badge>;
            case "High":
                return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none">High Risk</Badge>;
            default:
                return <Badge variant="secondary">{level}</Badge>;
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        // Always parse to Date object safely
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        // Fallback if invalid date
        if (isNaN(date.getTime())) return "N/A";
        // Use date-fns for deterministic formatting across server and client
        return format(date, "dd MMM yyyy");
    };

    const getScreeningsTodayCount = () => {
        const today = new Date();
        return reports.filter(r => {
            if (!r.timestamp) return false;
            const date = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
            return date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
        }).length;
    };

    const handleExportCSV = () => {
        if (filteredReports.length === 0) return;

        const headers = ["Patient ID", "Illness Type", "Score", "Risk Level", "Date Conducted"];
        const csvRows = [headers.join(",")];

        for (const report of filteredReports) {
            const row = [
                `"${report.userId}"`,
                `"${report.illnessType.replace('_', ' ')}"`,
                report.score,
                `"${report.riskLevel}"`,
                `"${formatDate(report.timestamp)}"`
            ];
            csvRows.push(row.join(","));
        }

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Medical_Reports_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Medical Reports</h1>
                    <p className="text-muted-foreground">View and export patient screening results for your organization.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Calendar className="mr-2 h-4 w-4" />
                                {startDate && endDate ? `${startDate} to ${endDate}` : startDate ? `From ${startDate}` : endDate ? `Until ${endDate}` : "Date Range"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filter by Date Range</h4>
                                    <p className="text-sm text-muted-foreground">Show reports completed within this period.</p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label htmlFor="startDate" className="text-sm">Start Date</label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="col-span-2 h-8"
                                            max={endDate || undefined}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label htmlFor="endDate" className="text-sm">End Date</label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="col-span-2 h-8"
                                            min={startDate || undefined}
                                        />
                                    </div>
                                    {(startDate || endDate) && (
                                        <Button
                                            variant="ghost"
                                            className="h-8 px-2 text-xs w-full mt-2"
                                            onClick={() => { setStartDate(""); setEndDate(""); }}
                                        >
                                            Clear Dates
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button className="h-10 font-semibold shadow-sm" onClick={handleExportCSV}>
                        <FileDown className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {[
                    { label: "Total Reports", value: reports.length, icon: ClipboardList, color: "text-blue-500" },
                    { label: "High Risk Flags", value: reports.filter(r => r.riskLevel === "High").length, icon: Activity, color: "text-rose-500" },
                    { label: "Screenings Today", value: getScreeningsTodayCount(), icon: Calendar, color: "text-emerald-500" },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-200 dark:border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{loading ? "..." : stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-900 ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by patient ID or illness..."
                                className="pl-10 h-10 bg-white dark:bg-slate-950"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-10">
                            <Filter className="mr-2 h-4 w-4" /> Risk Level
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead className="font-semibold">Patient ID</TableHead>
                                <TableHead className="font-semibold">Illness Type</TableHead>
                                <TableHead className="font-semibold text-center">Score</TableHead>
                                <TableHead className="font-semibold">Risk Level</TableHead>
                                <TableHead className="font-semibold">Date Conducted</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mx-auto" /></TableCell>
                                        <TableCell><div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></TableCell>
                                        <TableCell><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                                        No screening reports found for this organization.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReports.map((report) => (
                                    <TableRow key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                        <TableCell className="font-mono font-medium uppercase tracking-wider text-sm py-4">{report.userId}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {report.illnessType.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-mono font-semibold">{report.score}</TableCell>
                                        <TableCell>{getRiskBadge(report.riskLevel)}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{formatDate(report.timestamp)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
