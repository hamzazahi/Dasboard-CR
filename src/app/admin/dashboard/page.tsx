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
  Building2,
  Users,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Download,
  Calendar,
  Filter,
  Stethoscope,
  Activity,
  AlertTriangle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subDays,
} from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const SouthAfricaMap = dynamic(
  () => import("@/components/dashboard/SouthAfricaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl" />
    ),
  },
);
const RecentResultsTable = dynamic(
  () => import("@/components/dashboard/RecentResultsTable"),
  { ssr: false },
);
const ScreeningTypesModal = dynamic(
  () => import("@/components/dashboard/ScreeningTypesModal"),
  { ssr: false },
);
const ProvinceDetailsModal = dynamic(
  () => import("@/components/dashboard/ProvinceDetailsModal"),
  { ssr: false },
);

interface OrgStats {
  name: string;
  orgId: string;
  screeningCount: number;
  revenue: number;
}

const screeningPriorityMap: Record<
  string,
  { isHighPriority: boolean; priority: number }
> = {
  asthma_18_20_male: { isHighPriority: true, priority: 5 },
  std_18_20_female: { isHighPriority: true, priority: 5 },
  hiv_18_20_female: { isHighPriority: true, priority: 5 },
  lupus_18_20_female: { isHighPriority: true, priority: 5 },
  asthma_18_20_female: { isHighPriority: true, priority: 5 },
  tuberculosis_20_30_male: { isHighPriority: true, priority: 5 },
  mental_illness_20_30_male: { isHighPriority: true, priority: 5 },
  hiv_20_30_male: { isHighPriority: true, priority: 5 },
  bipolar_20_30_male: { isHighPriority: true, priority: 5 },
  tuberculosis_20_30_female: { isHighPriority: true, priority: 5 },
  std_20_30_female: { isHighPriority: true, priority: 5 },
  mental_illness_20_30_female: { isHighPriority: true, priority: 5 },
  hiv_20_30_female: { isHighPriority: true, priority: 5 },
  lupus_20_30_female: { isHighPriority: true, priority: 5 },
  bipolar_20_30_female: { isHighPriority: true, priority: 5 },
  tuberculosis_31_49_male: { isHighPriority: true, priority: 5 },
  hypertension_31_49_male: { isHighPriority: true, priority: 5 },
  hiv_31_49_male: { isHighPriority: true, priority: 5 },
  diabetes_31_49_male: { isHighPriority: true, priority: 5 },
  kidney_disease_31_49_male: { isHighPriority: true, priority: 5 },
  hepatitis_bc_31_49_male: { isHighPriority: true, priority: 5 },
  bipolar_31_49_male: { isHighPriority: true, priority: 5 },
  tuberculosis_31_49_female: { isHighPriority: true, priority: 5 },
  hypertension_31_49_female: { isHighPriority: true, priority: 5 },
  diabetes_31_49_female: { isHighPriority: true, priority: 5 },
  cervical_cancer_31_49_female: { isHighPriority: true, priority: 5 },
  breast_cancer_31_49_female: { isHighPriority: true, priority: 5 },
  underactive_thyroid_31_49_female: { isHighPriority: true, priority: 5 },
  overactive_thyroid_31_49_female: { isHighPriority: true, priority: 5 },
  kidney_disease_31_49_female: { isHighPriority: true, priority: 5 },
  hepatitis_bc_31_49_female: { isHighPriority: true, priority: 5 },
  bipolar_31_49_female: { isHighPriority: true, priority: 5 },
  diabetes_50_plus_male: { isHighPriority: true, priority: 5 },
  hearing_50_plus_male: { isHighPriority: true, priority: 5 },
  prostate_cancer_50_plus_male: { isHighPriority: true, priority: 5 },
  copd_50_plus_male: { isHighPriority: true, priority: 5 },
  kidney_disease_50_plus_male: { isHighPriority: true, priority: 5 },
  rheumatoid_arthritis_50_plus_male: { isHighPriority: true, priority: 5 },
  diabetes_50_plus_female: { isHighPriority: true, priority: 5 },
  hearing_50_plus_female: { isHighPriority: true, priority: 5 },
  breast_cancer_50_plus_female: { isHighPriority: true, priority: 5 },
  underactive_thyroid_50_plus_female: { isHighPriority: true, priority: 5 },
  copd_50_plus_female: { isHighPriority: true, priority: 5 },
  kidney_disease_50_plus_female: { isHighPriority: true, priority: 5 },
  menopause_50_plus_female: { isHighPriority: true, priority: 5 },
  rheumatoid_arthritis_50_plus_female: { isHighPriority: true, priority: 5 },
  dementia_65_plus_male: { isHighPriority: true, priority: 5 },
  dementia_65_plus_female: { isHighPriority: true, priority: 5 },
  suicidal_screening_all_ages: { isHighPriority: true, priority: 10 },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalScreenings: 0,
    totalReferrals: 0,
    recommendedScreenings: 0,
    lastWeekCount: 0,
    thisWeekCount: 0,
    referralTrend: 0,
    activeTrend: 0,
  });
  const [riskPhase, setRiskPhase] = useState<
    "overview" | "drilldown" | "details"
  >("overview");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(
    null,
  );
  const [selectedScoreRange, setSelectedScoreRange] = useState<string | null>(
    null,
  );
  const [scoreRangeDetails, setScoreRangeDetails] = useState<any[]>([]);

  const [riskStats, setRiskStats] = useState({
    totalReferrals: 0,
    critical: { count: 0, percentage: 0 },
    high: { count: 0, percentage: 0 },
    moderate: { count: 0, percentage: 0 },
    low: { count: 0, percentage: 0 },
  });
  const [riskChartData, setRiskChartData] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<
    { month: string; total: number; highRisk: number }[]
  >([]);
  const [screeningTypes, setScreeningTypes] = useState<
    { label: string; count: number; value: number }[]
  >([]);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [provinceStats, setProvinceStats] = useState<
    {
      name: string;
      amount: number; // Screenings
      value: number; // % Share of screenings
      userCount?: number;
      topScreeningType?: string;
      topScreeningCount?: number;
      variant: string;
    }[]
  >([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<
    Record<string, number>
  >({});
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [topInsight, setTopInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [rawScreenings, setRawScreenings] = useState<any[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);

  // Chart configurations
  const trendsConfig = {
    total: {
      label: "Total Screenings",
      color: "#9fe453",
    },
    highRisk: {
      label: "High-Risk Results",
      color: "#dc3545",
    },
  } satisfies ChartConfig;

  const completionConfig = {
    value: {
      label: "Completion Rate",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    setLoading(true);

    const screeningsQuery = query(collection(db, "screening_attempts"));
    const unsubscribeScreenings = onSnapshot(
      screeningsQuery,
      (screeningsSnap) => {
        const completedDocs = screeningsSnap.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
          .filter((d) => d.isCompleted);
        setRawScreenings(completedDocs);
      },
      (err) => console.error("Screenings Listener Error:", err),
    );

    // ---- 2. Users Listener (Reactive) ----
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (usersSnap) => {
        const users = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        setRawUsers(users);
      },
    );

    // ---- 3. Organizations Listener (Reactive) ----
    const unsubscribeOrgs = onSnapshot(
      collection(db, "organizations"),
      (orgsSnap) => {
        // Can add org specific logic here if needed
      },
    );

    return () => {
      unsubscribeScreenings();
      unsubscribeUsers();
      unsubscribeOrgs();
    };
  }, []);

  // Centralized Data Aggregation
  useEffect(() => {
    if (rawScreenings.length === 0 && rawUsers.length === 0) return;

    const today = new Date();
    const startOfThisWeek = subDays(today, today.getDay());
    const startOfLastWeek = subDays(startOfThisWeek, 7);

    // 1. Basic Stats & Weekly Trends
    const thisWeekCount = rawScreenings.filter(
      (doc) => (doc.completedAt?.toDate() || 0) >= startOfThisWeek,
    ).length;
    const lastWeekCount = rawScreenings.filter((doc) => {
      const d = doc.completedAt?.toDate();
      return d && d >= startOfLastWeek && d < startOfThisWeek;
    }).length;

    let referralTotal = 0;
    let recommendedTotal = 0;
    const typeCounts: Record<string, number> = {};

    rawScreenings.forEach((data) => {
      if (data.result?.needsReferral) referralTotal++;
      if (
        data.screeningId &&
        screeningPriorityMap[data.screeningId]?.isHighPriority
      ) {
        recommendedTotal++;
      }
      const type = data.screeningTitle || data.screeningType || "General";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const prevWeekReferrals = rawScreenings.filter((doc) => {
      const d = doc.completedAt?.toDate();
      return (
        d &&
        d >= startOfLastWeek &&
        d < startOfThisWeek &&
        doc.result?.needsReferral
      );
    }).length;
    const thisWeekReferrals = rawScreenings.filter((doc) => {
      const d = doc.completedAt?.toDate() || 0;
      return d >= startOfThisWeek && doc.result?.needsReferral;
    }).length;

    const referralTrend =
      prevWeekReferrals === 0
        ? thisWeekReferrals > 0
          ? 100
          : 0
        : Math.round(
            ((thisWeekReferrals - prevWeekReferrals) / prevWeekReferrals) * 100,
          );

    const prevWeekActive = new Set(
      rawScreenings
        .filter((doc) => {
          const d = doc.completedAt?.toDate();
          return d && d >= startOfLastWeek && d < startOfThisWeek;
        })
        .map((d) => d.userId),
    ).size;
    const thisWeekActive = new Set(
      rawScreenings
        .filter((doc) => (doc.completedAt?.toDate() || 0) >= startOfThisWeek)
        .map((d) => d.userId),
    ).size;

    const activeTrend =
      prevWeekActive === 0
        ? thisWeekActive > 0
          ? 100
          : 0
        : Math.round(
            ((thisWeekActive - prevWeekActive) / prevWeekActive) * 100,
          );

    setStats((prev) => ({
      ...prev,
      totalScreenings: rawScreenings.length,
      totalReferrals: referralTotal,
      recommendedScreenings: recommendedTotal,
      lastWeekCount,
      thisWeekCount,
      referralTrend,
      activeTrend,
      activeUsers: rawUsers.filter((u) => u.isActive).length,
    }));

    const screeningTypesData = Object.entries(typeCounts)
      .map(([label, count]) => ({
        label,
        count,
        value: Math.round((count / (rawScreenings.length || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);
    setScreeningTypes(screeningTypesData);

    // 2. Risk Stats & Score Distribution
    let globalLow = 0,
      globalMed = 0,
      globalHigh = 0,
      globalCritical = 0;
    const scoreBuckets: Record<string, number> = {
      "0-4": 0,
      "5-9": 0,
      "10-14": 0,
      "15-19": 0,
      "20-24": 0,
      "25-29": 0,
      "30-34": 0,
      "35-39": 0,
      "40-44": 0,
      "45-49": 0,
      "50-54": 0,
      "55-59": 0,
      "60-64": 0,
      "65-69": 0,
      "70-74": 0,
      "75-80": 0,
    };

    rawScreenings.forEach((data) => {
      if (data.result?.needsReferral) {
        const score = data.result.normalizedScore || 0;
        if (score <= 39) globalLow++;
        else if (score <= 60) globalMed++;
        else if (score <= 80) globalHigh++;
        else globalCritical++;

        const bucketStart = Math.floor(score / 5) * 5;
        const bucketKey =
          bucketStart >= 75 ? "75-80" : `${bucketStart}-${bucketStart + 4}`;
        if (scoreBuckets.hasOwnProperty(bucketKey)) scoreBuckets[bucketKey]++;
      }
    });

    const totalRiskCount =
      globalLow + globalMed + globalHigh + globalCritical || 1;
    setRiskStats({
      totalReferrals: referralTotal,
      low: {
        count: globalLow,
        percentage: Number(((globalLow / totalRiskCount) * 100).toFixed(1)),
      },
      moderate: {
        count: globalMed,
        percentage: Number(((globalMed / totalRiskCount) * 100).toFixed(1)),
      },
      high: {
        count: globalHigh,
        percentage: Number(((globalHigh / totalRiskCount) * 100).toFixed(1)),
      },
      critical: {
        count: globalCritical,
        percentage: Number(
          ((globalCritical / totalRiskCount) * 100).toFixed(1),
        ),
      },
    });
    setScoreDistribution(scoreBuckets);
    setRiskChartData(
      [
        { name: "Critical (>80)", value: globalCritical, color: "#991b1b" },
        {
          name: "High Likelihood (60-80)",
          value: globalHigh,
          color: "#dc3545",
        },
        {
          name: "Moderate Likelihood (40-60)",
          value: globalMed,
          color: "#f59e0b",
        },
        { name: "Low Likelihood (0-40)", value: globalLow, color: "#10b981" },
      ].filter((d) => d.value > 0),
    );

    // 3. Recent Results
    const latest = [...rawScreenings]
      .sort(
        (a, b) =>
          (b.completedAt?.toDate() || 0) - (a.completedAt?.toDate() || 0),
      )
      .slice(0, 10);
    setRecentResults(latest);

    // 4. Monthly Trends
    const monthsData: {
      month: string;
      total: number;
      highRisk: number;
      range: { start: Date; end: Date };
    }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      monthsData.push({
        month: format(d, "MMM"),
        total: 0,
        highRisk: 0,
        range: { start: startOfMonth(d), end: endOfMonth(d) },
      });
    }
    rawScreenings.forEach((data) => {
      const date = data.completedAt?.toDate();
      if (!date) return;
      const monthEntry = monthsData.find(
        (m) => m.range && isWithinInterval(date, m.range),
      );
      if (monthEntry) {
        monthEntry.total++;
        const lic = (data.result?.likelihoodCategory || "").toLowerCase();
        if (
          lic.includes("high") ||
          lic.includes("sev") ||
          (data.result?.normalizedScore || 0) > 60
        ) {
          monthEntry.highRisk++;
        }
      }
    });
    setMonthlyTrends(
      monthsData.map(({ month, total, highRisk }) => ({
        month,
        total,
        highRisk,
      })),
    );

    // 5. Province Stats (Linking screenings to regions)
    const userProvMap: Record<string, string> = {};
    rawUsers.forEach((u) => (userProvMap[u.id] = u.province || "Unknown"));

    const provAgg: Record<
      string,
      {
        screenings: number;
        users: number;
        types: Record<string, number>;
      }
    > = {};

    // Track users per province
    rawUsers.forEach((u) => {
      const p = u.province || "Unknown";
      if (!provAgg[p]) provAgg[p] = { screenings: 0, users: 0, types: {} };
      provAgg[p].users++;
    });

    // Track screenings per province
    rawScreenings.forEach((s) => {
      const p = userProvMap[s.userId] || "Unknown";
      if (!provAgg[p]) provAgg[p] = { screenings: 0, users: 0, types: {} };
      provAgg[p].screenings++;
      const type = s.screeningTitle || s.screeningType || "General";
      provAgg[p].types[type] = (provAgg[p].types[type] || 0) + 1;
    });

    const provinceStatsList = Object.entries(provAgg).map(([name, data]) => {
      const topTypeEntry = Object.entries(data.types).sort(
        (a, b) => b[1] - a[1],
      )[0];
      return {
        name,
        amount: data.screenings,
        userCount: data.users,
        topScreeningType: topTypeEntry ? topTypeEntry[0] : "None",
        topScreeningCount: topTypeEntry ? topTypeEntry[1] : 0,
        value: Math.round(
          (data.screenings / (rawScreenings.length || 1)) * 100,
        ),
        variant: data.screenings > 50 ? "success" : "info",
      };
    });

    const sortedProv = provinceStatsList.sort((a, b) => b.amount - a.amount);
    setProvinceStats(sortedProv);

    if (sortedProv[0] && sortedProv[0].amount > 0) {
      setTopInsight(
        `${sortedProv[0].name} leads with ${sortedProv[0].amount} completed screenings (${sortedProv[0].value}%).`,
      );
    }

    setLoading(false);
  }, [rawScreenings, rawUsers]);

  const fetchScoreRangeDetails = async (range: string) => {
    setLoading(true);
    try {
      const [minStr, maxStr] = range.split("-");
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);

      const screeningsSnap = await getDocs(
        collection(db, "screening_attempts"),
      );
      const details = screeningsSnap.docs
        .map((doc) => ({ ...(doc.data() as any) }))
        .filter((d) => {
          const score = d.result?.normalizedScore || 0;
          return d.result?.needsReferral && score >= min && score <= max;
        });

      setScoreRangeDetails(details);
      setRiskPhase("details");
    } catch (error) {
      console.error("Error fetching range details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Find peak month for alert
  const getPeakMonthMessage = () => {
    if (loading || monthlyTrends.length === 0) return "";
    const maxVal = Math.max(...monthlyTrends.map((m) => m.total));
    if (maxVal === 0) return "No screening data available for this year.";
    const peak = monthlyTrends.find((m) => m.total === maxVal);
    const highRiskInPeak = peak?.highRisk || 0;
    return `Peak activity in ${peak?.month} with ${maxVal.toLocaleString()} screenings. Risk concerns identified in ${highRiskInPeak} checks.`;
  };

  const screeningTrend =
    stats.lastWeekCount === 0
      ? stats.thisWeekCount > 0
        ? 100
        : 0
      : Math.round(
          ((stats.thisWeekCount - stats.lastWeekCount) / stats.lastWeekCount) *
            100,
        );

  const metricCards: {
    title: string;
    value: string | number;
    icon: any;
    trend: string;
    trendValue?: string;
    trendType: "positive" | "negative" | "neutral";
    onClick?: () => void;
  }[] = [
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      trend: "Platform usage",
      trendValue: `${stats.activeTrend >= 0 ? "+" : ""}${stats.activeTrend}%`,
      trendType: stats.activeTrend >= 0 ? "positive" : "negative",
    },
    {
      title: "Total Screenings",
      value: stats.totalScreenings.toLocaleString(),
      icon: ClipboardList,
      trend: "Seven-day change",
      trendValue: `${screeningTrend >= 0 ? "+" : ""}${screeningTrend}%`,
      trendType: screeningTrend >= 0 ? "positive" : "negative",
      onClick: () => setIsScreeningModalOpen(true),
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals.toLocaleString(),
      icon: Eye,
      trend: "Needs attention",
      trendValue: `${stats.referralTrend >= 0 ? "+" : ""}${stats.referralTrend}%`,
      trendType: stats.referralTrend >= 0 ? "negative" : "positive",
    },
    {
      title: "Recommended Screenings",
      value: stats.recommendedScreenings.toLocaleString(),
      icon: AlertTriangle,
      trend: "High priority cases",
      trendValue: "Actionable",
      trendType: "positive",
    },
  ];

  /** Get initials from an org name like "Alkawitech" → "AL" */
  function getInitials(name: string): string {
    const words = name.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-8">
      {/* <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-muted-foreground">Welcome back, Platform Administrator.</p>
            </div> */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.title}
            onClick={metric.onClick}
            className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group ${metric.onClick ? "cursor-pointer active:scale-95" : ""}`}
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
                        : metric.trendType === "negative"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {metric.trendType === "positive" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <Activity className="w-3 h-3" />
                    )}
                    {metric.trendValue || "0%"}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {metric.trend}
                  </span>
                </div>
                {metric.onClick && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    Details <ArrowUpRight className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 2. Monthly Screening Trends */}
        <Card className="lg:col-span-4 border-none shadow-sm bg-white dark:bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Monthly Screening Trends
                </CardTitle>
                <CardDescription>
                  Tracking platform-wide engagement over time.
                </CardDescription>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!loading && monthlyTrends.length > 0 && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3 shadow-sm">
                <Activity className="w-5 h-5 text-emerald-500" />
                {getPeakMonthMessage()}
              </div>
            )}
            <ChartContainer config={trendsConfig} className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="adminTotalBarGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#a3e635" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#4d7c0f"
                        stopOpacity={0.85}
                      />
                    </linearGradient>
                    <linearGradient
                      id="adminHighRiskAreaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#dc3545"
                        stopOpacity={0.65}
                      />
                      <stop
                        offset="95%"
                        stopColor="#dc3545"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    className="text-xs font-bold text-slate-400"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs font-bold text-slate-400"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="total"
                    fill="url(#adminTotalBarGrad)"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                  <Area
                    type="monotone"
                    dataKey="highRisk"
                    fill="url(#adminHighRiskAreaGrad)"
                    stroke="#dc3545"
                    fillOpacity={1}
                    strokeWidth={2.5}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 3. Top Screening Types */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">
                Top Screening Types
              </CardTitle>
              <CardDescription>
                Distribution by screening focus.
              </CardDescription>
            </div>
            <button
              onClick={() => setIsScreeningModalOpen(true)}
              className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-tighter"
            >
              View All <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))
                : screeningTypes.slice(0, 5).map((type, idx) => (
                    <div key={type.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate mr-2">
                          {type.label}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500`}
                        >
                          {type.value}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                          <div
                            className={`h-full bg-primary`}
                            style={
                              { width: `${type.value}%` } as React.CSSProperties
                            }
                          />
                        </div>
                        <span className="text-[10px] font-black w-6 text-right text-slate-400">
                          {type.count}
                        </span>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Risk Level distribution (Side-by-side layout) */}
      </div>

      {/* 4. Risk-Level Referrals (3-Phase Drill-down) - Full Width */}
      <div className="w-full mt-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  {riskPhase === "overview" && "Risk-Level Referrals"}
                  {riskPhase === "drilldown" &&
                    `Score Distribution: ${selectedRiskLevel}`}
                  {riskPhase === "details" &&
                    `Individual Cases: ${selectedScoreRange}`}
                </CardTitle>
                <CardDescription>
                  {riskPhase === "overview" &&
                    "Severity breakdown of all referrals."}
                  {riskPhase === "drilldown" &&
                    `Refining by ${selectedRiskLevel} risk score ranges.`}
                  {riskPhase === "details" &&
                    `Reviewing ${scoreRangeDetails.length} specific screening outcomes.`}
                </CardDescription>
              </div>
              {riskPhase !== "overview" && (
                <button
                  onClick={() =>
                    setRiskPhase(
                      riskPhase === "details" ? "drilldown" : "overview",
                    )
                  }
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 rotate-180" />
                  Back to{" "}
                  {riskPhase === "details" ? "Distribution" : "Overview"}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {riskPhase === "overview" && (
              <div className="grid md:grid-cols-2 gap-6 items-center py-2">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                      Total Referrals Requiring Attention
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white">
                      {riskStats.totalReferrals.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["critical", "high", "moderate", "low"].map((key) => {
                      const data = (riskStats as any)[key];
                      const colors: any = {
                        critical: "#991b1b",
                        high: "#dc3545",
                        moderate: "#f59e0b",
                        low: "#10b981",
                      };
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 rounded-xl transition-all cursor-pointer group shadow-sm hover:shadow-md"
                          onClick={() => {
                            setSelectedRiskLevel(key);
                            setRiskPhase("drilldown");
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: colors[key] }}
                            />
                            <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                              {key}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-lg">
                              {data.count}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {data.percentage}%
                            </span>
                            <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center text-slate-400 font-medium italic">
                    Click any category for detailed score distribution
                  </p>
                </div>

                <div className="relative flex justify-center items-center">
                  <PieChart width={320} height={320}>
                    <Pie
                      data={riskChartData}
                      cx={160}
                      cy={160}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(data) => {
                        setSelectedRiskLevel(
                          data.name.toLowerCase().split(" ")[0],
                        );
                        setRiskPhase("drilldown");
                      }}
                    >
                      {riskChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    />
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      Referral Rates
                    </span>
                    <span className="text-3xl font-black">
                      {Math.round(
                        (riskStats.totalReferrals / stats.totalScreenings) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

            {riskPhase === "drilldown" && (
              <div className="py-6 space-y-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(scoreDistribution)
                        .filter(([k]) => {
                          const score = parseInt(k.split("-")[0]);
                          if (selectedRiskLevel === "low") return score <= 39;
                          if (selectedRiskLevel === "moderate")
                            return score > 39 && score <= 60;
                          if (selectedRiskLevel === "high")
                            return score > 60 && score <= 80;
                          if (selectedRiskLevel === "critical")
                            return score > 80;
                          return true;
                        })
                        .map(([range, count]) => ({ range, count }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      onClick={(data) => {
                        if (data?.activePayload?.[0]?.payload?.range) {
                          setSelectedScoreRange(
                            data.activePayload[0].payload.range,
                          );
                          fetchScoreRangeDetails(
                            data.activePayload[0].payload.range,
                          );
                        }
                      }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-slate-100 dark:stroke-slate-800"
                      />
                      <XAxis
                        dataKey="range"
                        className="text-[10px] font-bold text-slate-400"
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Normalized Score Range",
                          position: "bottom",
                          offset: 0,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      />
                      <YAxis
                        className="text-[10px] font-bold text-slate-400"
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Case Count",
                          angle: -90,
                          position: "insideLeft",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.02)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "10px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill={
                          selectedRiskLevel === "critical"
                            ? "#991b1b"
                            : selectedRiskLevel === "high"
                              ? "#dc3545"
                              : selectedRiskLevel === "moderate"
                                ? "#f59e0b"
                                : "#10b981"
                        }
                        radius={[6, 6, 0, 0]}
                        className="cursor-pointer"
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-center text-muted-foreground font-bold bg-slate-50 dark:bg-slate-900/50 py-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  Click any bar to drill down into the specific screening
                  results for that score range.
                </div>
              </div>
            )}

            {riskPhase === "details" && (
              <div className="py-4">
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                  {loading ? (
                    <div className="text-center py-20">
                      <Activity className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-500">
                        Retrieving case records...
                      </p>
                    </div>
                  ) : scoreRangeDetails.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground text-sm font-medium">
                      No records found for this range.
                    </div>
                  ) : (
                    scoreRangeDetails.map((detail, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                              <Stethoscope className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-800 dark:text-slate-200 block uppercase tracking-tight">
                                {detail.screeningTitle || detail.screeningType}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                UID: {detail.userId?.slice(0, 12)}...
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="px-2 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-black shadow-sm">
                              SCORE: {detail.result?.normalizedScore}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                              {format(
                                detail.completedAt?.toDate() || new Date(),
                                "dd MMM, HH:mm",
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner`}
                          >
                            <div
                              className={`h-full bg-red-600 shadow-[0_0_10px_rgba(220,53,69,0.3)] transition-all duration-700`}
                              style={
                                {
                                  width: `${detail.result?.normalizedScore}%`,
                                } as React.CSSProperties
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 italic truncate w-48">
                            Category:{" "}
                            {detail.result?.likelihoodCategory ||
                              "Presumptive Likelihood"}
                          </span>
                          <button className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                            View Full Report{" "}
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="w-full border-none shadow-sm bg-white dark:bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-bold">
              Screenings by Province
            </CardTitle>
            <CardDescription>
              Geographic distribution of health checks.
            </CardDescription>
          </div>
          <button
            onClick={() => setIsProvinceModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white hover:bg-slate-900 rounded-lg text-xs font-black transition-all shadow-sm"
          >
            Click for details <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent className="p-4">
          {!loading && topInsight && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-bold text-blue-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{topInsight}</span>
            </div>
          )}
          <div className="grid lg:grid-cols-2 gap-6">
            <SouthAfricaMap provinces={provinceStats} />
            <div className="grid grid-cols-3 gap-3 content-start">
              {provinceStats
                .filter((p) => p.name !== "Unknown")
                .map((province) => (
                  <div
                    key={province.name}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {province.name}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 ml-1">
                        {province.value}%
                      </span>
                    </div>
                    <div className="text-lg font-black text-primary">
                      {province.amount >= 1000
                        ? `${(province.amount / 1000).toFixed(1)}K`
                        : province.amount}
                    </div>
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${province.value}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Recent Screening Results - Full Width */}
      <div className="w-full mt-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Recent Screening Results
                </CardTitle>
                <CardDescription>
                  The 10 latest health screenings across the platform.
                </CardDescription>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-black text-white hover:bg-slate-900 rounded-lg text-xs font-black transition-all shadow-sm">
                Click for details
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <RecentResultsTable results={recentResults} loading={loading} />
          </CardContent>
        </Card>
      </div>
      {/* Detail Modals */}
      <ScreeningTypesModal
        open={isScreeningModalOpen}
        onOpenChange={setIsScreeningModalOpen}
        data={screeningTypes}
      />

      <ProvinceDetailsModal
        open={isProvinceModalOpen}
        onOpenChange={setIsProvinceModalOpen}
        provinces={provinceStats}
      />
    </div>
  );
}

// Helper function to assign color variants for provinces
const getVariantForProvince = (province: string) => {
  const variants: Record<string, string> = {
    "Western Cape": "success",
    Gauteng: "info",
    "KwaZulu-Natal": "warning",
    "Eastern Cape": "secondary",
    Limpopo: "primary",
    Mpumalanga: "success",
    "North West": "info",
    "Northern Cape": "warning",
    "Free State": "destructive",
  };
  return variants[province] || "secondary";
};
