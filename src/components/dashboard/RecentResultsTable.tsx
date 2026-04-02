"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ScreeningResult {
    id: string;
    userId: string;
    screeningTitle?: string;
    screeningType: string;
    completedAt: any;
    result?: {
        likelihoodCategory: string;
        normalizedScore: number;
    };
}

interface RecentResultsTableProps {
    results: ScreeningResult[];
    loading: boolean;
}

export default function RecentResultsTable({ results, loading }: RecentResultsTableProps) {
    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 w-full bg-slate-100 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed">
                No recent screenings found.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="font-bold">User ID</TableHead>
                        <TableHead className="font-bold">Screening Type</TableHead>
                        <TableHead className="font-bold">Date & Time</TableHead>
                        <TableHead className="font-bold">Risk Level</TableHead>
                        <TableHead className="font-bold text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {results.map((result) => {
                        const risk = (result.result?.likelihoodCategory || "Unknown");
                        const score = result.result?.normalizedScore || 0;
                        const date = result.completedAt?.toDate();

                        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
                        if (risk.toLowerCase().includes("high") || risk.toLowerCase().includes("sev")) {
                            variant = "destructive";
                        } else if (risk.toLowerCase().includes("moderate")) {
                            variant = "secondary";
                        }

                        return (
                            <TableRow key={result.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-mono text-[10px] text-slate-500">
                                    {result.userId.substring(0, 12)}...
                                </TableCell>
                                <TableCell className="font-medium">
                                    {result.screeningTitle || result.screeningType}
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm">
                                    {date ? format(date, "MMM d, h:mm a") : "N/A"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={variant} className="whitespace-nowrap rounded font-bold uppercase text-[9px]">
                                        {risk}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {score.toFixed(1)}%
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
