"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    TrendingUp,
    DollarSign,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Calendar,
    Filter,
    Stethoscope
} from "lucide-react";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";

interface Transaction {
    id: string;
    screeningTitle?: string;
    amount: number;
    platformShare: number;
    providerShare: number;
    currency: string;
    status: string;
    createdAt: any;
    userId?: string;
}

export default function EarningsPage() {
    const { orgId } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const q = query(
            collection(db, "transactions"),
            where("orgId", "==", orgId),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];
            setTransactions(txData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
        }).format(amount); // Removed / 100 as per Cloud Function float storage
    };

    // Aggregate stats
    const totalRevenue = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const totalPayout = transactions.reduce((acc, tx) => acc + (tx.providerShare || 0), 0);
    const totalCommission = transactions.reduce((acc, tx) => acc + (tx.platformShare || 0), 0);

    // Chart configuration
    const chartConfig = {
        payout: {
            label: "Payout",
            color: "var(--chart-1)",
        },
        revenue: {
            label: "Total Revenue",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig;

    // Chart data (last 7 days or sample points)
    const chartData = transactions
        .slice(0, 7)
        .reverse()
        .map(tx => ({
            date: tx.createdAt ? format(tx.createdAt.toDate(), "MMM dd") : "Pending",
            payout: tx.providerShare || 0,
            revenue: tx.amount || 0
        }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Earnings & Payouts</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track your organization's revenue from patient screenings.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="shadow-sm">
                        <Calendar className="mr-2 h-4 w-4" /> Last 30 Days
                    </Button>
                    <Button className="font-semibold shadow-sm">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, trend: "+12.5%", pos: true },
                    { label: "Net Earnings", value: formatCurrency(totalPayout), icon: TrendingUp, trend: "+14.2%", pos: true },
                    { label: "Platform Fees", value: formatCurrency(totalCommission), icon: CreditCard, trend: "-2.1%", pos: false },
                    { label: "Total Screenings", value: transactions.length, icon: Stethoscope, trend: "+8.4%", pos: true },
                ].map((stat, i) => (
                    <Card key={i} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-white dark:bg-slate-950">
                        <CardContent className="p-0">
                            {/* Top Section */}
                            <div className="p-6 flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                                        {loading ? "..." : stat.value}
                                    </div>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            
                            {/* Footer Section */}
                            <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                        stat.pos ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {stat.pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {stat.trend}
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">{stat.label === "Total Screenings" ? "Overall" : "vs last month"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Daily payout performance trends over the last week.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
                            <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                                <defs>
                                    <linearGradient id="fillPayout" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-payout)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-payout)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `R${value}`}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Area
                                    dataKey="payout"
                                    type="natural"
                                    fill="url(#fillPayout)"
                                    stroke="var(--color-payout)"
                                    stackId="a"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Last 5 screening payments and splits.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-4 animate-pulse space-y-2">
                                        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                                    </div>
                                ))
                            ) : transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{tx.screeningTitle || "Platform Subscription"}</span>
                                        <span className="text-xs text-slate-500">{tx.createdAt ? format(tx.createdAt.toDate(), "MMM dd, yyyy HH:mm") : "..."}</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-sm font-bold text-emerald-600">+{formatCurrency(tx.providerShare)}</span>
                                        <Badge variant="ghost" className="text-[10px] p-0 text-slate-400">Fee: {formatCurrency(tx.platformShare)}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t flex justify-center">
                        <Button variant="link" size="sm" className="text-xs font-semibold">View All Transactions</Button>
                    </div>
                </Card>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Detailed Payout History</CardTitle>
                        <Button variant="outline" size="sm" className="h-8">
                            <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30 dark:bg-slate-900/30">
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Date</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Patient ID</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Screening Type</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Platform Fee</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50 text-right pr-6">Your Earnings</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="h-12 bg-slate-50/50 dark:bg-slate-900/20 animate-pulse" />
                                    </TableRow>
                                ))
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">No transactions recorded yet.</TableCell>
                                </TableRow>
                            ) : transactions.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors border-slate-200 dark:border-slate-800">
                                    <TableCell className="text-sm">{tx.createdAt ? format(tx.createdAt.toDate(), "MMM dd, yyyy") : "..."}</TableCell>
                                    <TableCell className="text-sm font-mono text-slate-500">...{tx.userId?.slice(-6) || "N/A"}</TableCell>
                                    <TableCell className="text-sm font-medium">{tx.screeningTitle || "Subscription Upgrade"}</TableCell>
                                    <TableCell className="text-sm text-slate-400">{formatCurrency(tx.platformShare)}</TableCell>
                                    <TableCell className="text-sm font-bold text-emerald-600 text-right pr-6">{formatCurrency(tx.providerShare)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
