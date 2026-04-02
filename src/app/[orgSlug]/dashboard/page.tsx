"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Smartphone,
  AlertTriangle,
  Settings,
} from "lucide-react";
import {
  collection,
  query,
  getDocs,
  where,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

import { subDays, format, isSameDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const pieColors = {
  Low: "#10b981", // Emerald
  Medium: "#f59e0b", // Amber
  High: "#ef4444", // Red
};

export default function OrgDashboardPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { orgId, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    orgName: "Organisation",
    totalPatients: 0,
    totalScreenings: 0,
    totalStaff: 0,
    revenue: 0,
    referralsNeeded: 0,
    highRiskCount: 0,
    screeningTrend: 0,
    referralTrend: 0,
    revenueTrend: 0,
    highRiskTrend: 0,
  });
  const [chartData, setChartData] = useState({
    volumeByDay: [] as any[],
    riskDistribution: [] as any[],
    topIllnesses: [] as any[],
    riskTrend: [] as any[],
    referralsByType: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // Chart configurations
  const volumeConfig = {
    count: {
      label: "Screenings",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const riskConfig = {
    "Low Risk": {
      label: "Low Risk",
      color: "var(--chart-1)",
    },
    "Medium Risk": {
      label: "Medium Risk",
      color: "var(--chart-2)",
    },
    "High Risk": {
      label: "High Risk",
      color: "var(--destructive)",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    async function fetchOrgStats() {
      if (!orgId) return;

      try {
        const orgDoc = await getDoc(doc(db, "organizations", orgId));
        const screeningsSnap = await getDocs(
          query(
            collection(db, "screening_attempts"),
            where("orgId", "==", orgId),
          ),
        );
        const usersSnap = await getDocs(
          query(collection(db, "users"), where("orgId", "==", orgId)),
        );
        const txSnap = await getDocs(
          query(collection(db, "transactions"), where("orgId", "==", orgId)),
        );

        const totalRevenue = txSnap.docs.reduce(
          (acc, doc) => acc + (doc.data().providerShare || 0),
          0,
        );

        // --- Calculate Weekly Trends ---
        const today = new Date();
        const startOfThisWeek = subDays(today, today.getDay());
        const startOfLastWeek = subDays(startOfThisWeek, 7);

        const thisWeekDocs = screeningsSnap.docs.filter(
          (doc) => (doc.data().completedAt?.toDate() || 0) >= startOfThisWeek,
        );
        const lastWeekDocs = screeningsSnap.docs.filter((doc) => {
          const d = doc.data().completedAt?.toDate();
          return d && d >= startOfLastWeek && d < startOfThisWeek;
        });

        const calculateTrend = (prev: number, curr: number) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return Math.round(((curr - prev) / prev) * 100);
        };

        const screeningTrend = calculateTrend(
          lastWeekDocs.length,
          thisWeekDocs.length,
        );
        const referralTrend = calculateTrend(
          lastWeekDocs.filter((d) => d.data().result?.needsReferral).length,
          thisWeekDocs.filter((d) => d.data().result?.needsReferral).length,
        );
        const highRiskTrend = calculateTrend(
          lastWeekDocs.filter((d) => {
            const r = (d.data().result?.likelihoodCategory || "").toLowerCase();
            return r.includes("high") || r.includes("sev");
          }).length,
          thisWeekDocs.filter((d) => {
            const r = (d.data().result?.likelihoodCategory || "").toLowerCase();
            return r.includes("high") || r.includes("sev");
          }).length,
        );

        const thisWeekRev = txSnap.docs
          .filter(
            (doc) => (doc.data().createdAt?.toDate() || 0) >= startOfThisWeek,
          )
          .reduce((acc, doc) => acc + (doc.data().providerShare || 0), 0);
        const lastWeekRev = txSnap.docs
          .filter((doc) => {
            const d = doc.data().createdAt?.toDate();
            return d && d >= startOfLastWeek && d < startOfThisWeek;
          })
          .reduce((acc, doc) => acc + (doc.data().providerShare || 0), 0);
        const revenueTrend = calculateTrend(lastWeekRev, thisWeekRev);

        // --- Calculate Risk Distribution ---
        let lowRisk = 0;
        let medRisk = 0;
        let highRisk = 0;

        screeningsSnap.docs.forEach((doc) => {
          const data = doc.data();
          const risk = (data.result?.likelihoodCategory || "Low").toLowerCase();

          // Check for high/severe first
          if (risk.includes("high") || risk.includes("sev")) {
            highRisk++;
          }
          // Check for medium/moderate
          else if (risk.includes("med") || risk.includes("mod")) {
            medRisk++;
          }
          // Check for low specifically, or default to low if unrecognized
          else {
            lowRisk++;
          }
        });

        const riskData = [
          { name: "Low Risk", value: lowRisk, color: pieColors.Low },
          { name: "Medium Risk", value: medRisk, color: pieColors.Medium },
          { name: "High Risk", value: highRisk, color: pieColors.High },
        ].filter((r) => r.value > 0); // Only show segments with > 0 screenings

        // --- Calculate Top Illnesses & Referrals By Type ---
        const illnessCounts: Record<string, number> = {};
        const referralCounts: Record<string, number> = {};

        screeningsSnap.docs.forEach((doc) => {
          const data = doc.data();
          const title = data.screeningTitle || "Unknown";

          illnessCounts[title] = (illnessCounts[title] || 0) + 1;

          if (data.result?.needsReferral === true) {
            referralCounts[title] = (referralCounts[title] || 0) + 1;
          }
        });

        const topIllnesses = Object.entries(illnessCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const referralsByType = Object.entries(referralCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        // --- Calculate 14-Day Screening Volume & Risk Trend ---
        const volumeData: any[] = [];
        const riskTrendData: any[] = [];

        for (let i = 13; i >= 0; i--) {
          const targetDate = subDays(new Date(), i);
          const formattedDate = format(targetDate, "dd MMM");

          const dayDocs = screeningsSnap.docs.filter((doc) => {
            const data = doc.data();
            if (!data.completedAt) return false;
            return isSameDay(data.completedAt.toDate(), targetDate);
          });

          // Volume
          volumeData.push({
            date: formattedDate,
            count: dayDocs.length,
          });

          // Risk Trend (Average normalized score)
          const totalScore = dayDocs.reduce(
            (acc, doc) => acc + (doc.data().result?.normalizedScore || 0),
            0,
          );
          const avgScore =
            dayDocs.length > 0 ? Math.round(totalScore / dayDocs.length) : 0;

          riskTrendData.push({
            date: formattedDate,
            avgScore: avgScore,
          });
        }

        setChartData({
          volumeByDay: volumeData,
          riskDistribution: riskData,
          topIllnesses,
          riskTrend: riskTrendData,
          referralsByType,
        });

        setStats({
          orgName: orgDoc.data()?.name || "My Organisation",
          totalPatients: usersSnap.docs.filter(
            (d: any) => d.data().role === "patient",
          ).length,
          totalScreenings: screeningsSnap.size,
          totalStaff: usersSnap.docs.filter(
            (d: any) => d.data().role !== "patient",
          ).length,
          revenue: totalRevenue,
          referralsNeeded: screeningsSnap.docs.filter(
            (doc) => doc.data().result?.needsReferral === true,
          ).length,
          highRiskCount: highRisk,
          screeningTrend,
          referralTrend,
          revenueTrend,
          highRiskTrend,
        });
      } catch (error) {
        console.error("Error fetching org stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchOrgStats();
    }
  }, [orgId, authLoading]);

  const metricCards = [
    {
      title: "Total Screenings",
      value: stats.totalScreenings.toLocaleString(),
      icon: ClipboardList,
      trend: "Seven-day change",
      trendValue: `${stats.screeningTrend >= 0 ? "+" : ""}${stats.screeningTrend}%`,
      trendType: stats.screeningTrend >= 0 ? "positive" : "negative",
    },
    {
      title: "High Risk Cases",
      value: stats.highRiskCount.toLocaleString(),
      icon: AlertTriangle,
      trend: "Risk assessment",
      trendValue: `${stats.highRiskTrend >= 0 ? "+" : ""}${stats.highRiskTrend}%`,
      trendType: stats.highRiskTrend <= 0 ? "positive" : "negative",
    },
    {
      title: "Organisation Revenue",
      value: `R${stats.revenue.toLocaleString()}`,
      icon: TrendingUp,
      trend: "Weekly trajectory",
      trendValue: `${stats.revenueTrend >= 0 ? "+" : ""}${stats.revenueTrend}%`,
      trendType: stats.revenueTrend >= 0 ? "positive" : "negative",
    },
    {
      title: "Referrals Issued",
      value: stats.referralsNeeded.toLocaleString(),
      icon: Activity,
      trend: "Attention needed",
      trendValue: `${stats.referralTrend >= 0 ? "+" : ""}${stats.referralTrend}%`,
      trendType: stats.referralTrend <= 0 ? "positive" : "negative",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-400 bg-clip-text text-transparent">
            {stats.orgName}
          </h1>
          <p className="text-muted-foreground font-medium">
            Welcome to your organization's screening health dashboard.
          </p>
        </div>
        ,
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.title}
            className="overflow-hidden border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group bg-white/70 backdrop-blur-md"
          >
            <CardContent className="p-0">
              {/* Top Section: Icon & Value */}
              <div className="p-6 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {metric.title}
                  </p>
                  <div className="text-3xl font-extrabold tracking-tight">
                    {loading ? (
                      <Skeleton className="h-9 w-24 mt-1" />
                    ) : (
                      metric.value
                    )}
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <metric.icon className="h-6 w-6 text-primary" />
                </div>
              </div>

              {/* Bottom Section: Trend & View More */}
              <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                      metric.trendType === "positive"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {metric.trendType === "positive" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <Activity className="w-3 h-3" />
                    )}
                    {metric.trendValue}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {metric.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Screening Volume
            </CardTitle>
            <CardDescription>
              Daily screenings performed over the last 14 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer
                config={volumeConfig}
                className="h-[300px] w-full"
              >
                <BarChart data={chartData.volumeByDay}>
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#15803d"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    style={{ fontSize: "12px" }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 200, 150, 0.05)" }}
                    content={
                      <ChartTooltipContent className="bg-white/80 backdrop-blur-md border-slate-100 shadow-xl" />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" /> Risk Distribution
            </CardTitle>
            <CardDescription>
              Overall screening risk levels across your patient base.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-full" />
            ) : (
              <ChartContainer
                config={riskConfig}
                className="mx-auto aspect-[4/3] h-[300px] w-full"
              >
                {chartData.riskDistribution.length > 0 ? (
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent className="bg-white/80 backdrop-blur-md border-slate-100 shadow-xl" />
                      }
                    />
                    <Pie
                      data={chartData.riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={80}
                      outerRadius={110}
                      strokeWidth={8}
                      stroke="var(--card)"
                      animationDuration={1500}
                      isAnimationActive={true}
                      paddingAngle={5}
                    >
                      {chartData.riskDistribution.map((entry, index) => {
                        let fillColor = "var(--chart-5)";
                        const name = entry.name.toLowerCase();
                        if (name.includes("low")) fillColor = "var(--chart-1)";
                        else if (name.includes("medium"))
                          fillColor = "var(--chart-2)";
                        else if (name.includes("high"))
                          fillColor = "var(--destructive)";

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={fillColor}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        );
                      })}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="flex-wrap gap-x-4 gap-y-2 justify-center mt-6"
                    />
                  </PieChart>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-bold">
                      No distribution data available
                    </p>
                  </div>
                )}
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 5 Illnesses Bar Chart */}
        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-500" /> Top 5
              Illness Screenings
            </CardTitle>
            <CardDescription>
              Most frequently screened conditions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Screenings", color: "var(--primary)" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart
                data={chartData.topIllnesses}
                layout="vertical"
                margin={{ left: 30 }}
              >
                <defs>
                  <linearGradient
                    id="topIllnessGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  className="stroke-muted/30"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  style={{ fontSize: "12px", fontWeight: 500 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="bg-white/80 backdrop-blur-md shadow-xl" />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="url(#topIllnessGradient)"
                  radius={[0, 8, 8, 0]}
                  animationDuration={1500}
                  isAnimationActive={true}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Risk Score Trend Line Chart */}
        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" /> Average Risk
              Score Trend
            </CardTitle>
            <CardDescription>
              Average patient risk score trajectory over 14 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                avgScore: { label: "Risk Score", color: "var(--destructive)" },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={chartData.riskTrend}>
                <defs>
                  <linearGradient
                    id="colorRiskLine"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-muted/30"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  style={{ fontSize: "11px" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  style={{ fontSize: "11px" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="bg-white/80 backdrop-blur-md shadow-xl" />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="var(--destructive)"
                  fillOpacity={1}
                  fill="url(#colorRiskLine)"
                  strokeWidth={3}
                  animationDuration={2000}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Referrals By Type Chart */}
        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Referrals by
              Screening Type
            </CardTitle>
            <CardDescription>
              Conditions requiring immediate medical follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { label: "Referrals", color: "#f59e0b" } }}
              className="h-[300px] w-full"
            >
              <BarChart data={chartData.referralsByType}>
                <defs>
                  <linearGradient
                    id="referralGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor="#b45309"
                      stopOpacity={0.85}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-muted/30"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  style={{ fontSize: "11px" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  style={{ fontSize: "11px" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="bg-white/80 backdrop-blur-md shadow-xl" />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="url(#referralGradient)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Radial Gauge for Referral Rate */}
        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Screening
              Outcome Rate
            </CardTitle>
            <CardDescription>
              Ratio of cases requiring referral vs total performed.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center relative">
            <ChartContainer config={{}} className="h-full w-full">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={24}
                data={[
                  {
                    name: "Referral Rate",
                    value: Math.round(
                      (stats.referralsNeeded / (stats.totalScreenings || 1)) *
                        100,
                    ),
                    fill: "var(--destructive)",
                  },
                ]}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={12}
                  animationDuration={2000}
                  isAnimationActive={true}
                />
              </RadialBarChart>
            </ChartContainer>
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-4xl font-black text-slate-800 tracking-tighter">
                {Math.round(
                  (stats.referralsNeeded / (stats.totalScreenings || 1)) * 100,
                )}
                %
              </p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">
                Referral Rate
              </p>
            </div>
            <div className="grid grid-cols-2 gap-12 w-full mt-[-40px]">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-800">
                  {stats.totalScreenings}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  TOTAL
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-destructive">
                  {stats.referralsNeeded}
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  REFERRED
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
