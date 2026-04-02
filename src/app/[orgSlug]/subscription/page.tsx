"use client";

import React, { useState, useEffect } from "react";
import {
    doc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { collection, getDocs, updateDoc } from "firebase/firestore";
import {
    CreditCard,
    Calendar,
    CheckCircle2,
    Package,
    ShieldCheck,
    TrendingUp,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { startH360Payment } from "@/app/actions/payfast";

interface Organization {
    orgName: string;
    planTier: string;
    status: string;
    subscriptionExpiresAt: any;
    allowedIllnesses: string[];
}

interface Plan {
    id: string;
    name: string;
    tier: string;
    maxIllnesses: number;
    maxUsers: number;
    priceMonthlyZAR: number;
    features: string[];
}

export default function SubscriptionPage() {
    const { orgId } = useAuth();
    const [org, setOrg] = useState<Organization | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRenewing, setIsRenewing] = useState(false);
    const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
    const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null);

    useEffect(() => {
        if (!orgId) return;

        const fetchAllPlans = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "plans"));
                const fetchedPlans: Plan[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedPlans.push({ id: doc.id, ...doc.data() } as Plan);
                });
                fetchedPlans.sort((a, b) => a.priceMonthlyZAR - b.priceMonthlyZAR);
                setAllPlans(fetchedPlans);
            } catch (err) {
                console.error("Error fetching all plans:", err);
            }
        };

        fetchAllPlans();

        const unsubscribe = onSnapshot(doc(db, "organizations", orgId), async (snapshot) => {
            if (snapshot.exists()) {
                const orgData = snapshot.data() as Organization;
                setOrg(orgData);

                // Fetch current plan details
                const planId = `${orgData.planTier}_plan`;
                const planSnap = await getDoc(doc(db, "plans", planId));
                if (planSnap.exists()) {
                    setPlan({ id: planSnap.id, ...planSnap.data() } as Plan);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!org || !plan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
                <h2 className="text-xl font-semibold">Subscription info not found</h2>
                <p className="text-slate-500">Please contact platform support if this persists.</p>
            </div>
        );
    }

    const usagePercent = (org.allowedIllnesses.length / plan.maxIllnesses) * 100;

    // Safely parse the expiry date which could be a Firestore Timestamp, an ISO string, or an actual Date object
    let expiryDate: Date | null = null;
    if (org.subscriptionExpiresAt) {
        if (typeof org.subscriptionExpiresAt.toDate === 'function') {
            expiryDate = org.subscriptionExpiresAt.toDate();
        } else if (typeof org.subscriptionExpiresAt === 'string') {
            expiryDate = new Date(org.subscriptionExpiresAt);
        } else if (org.subscriptionExpiresAt instanceof Date) {
            expiryDate = org.subscriptionExpiresAt;
        }
    }

    const handleRenew = async () => {
        if (!orgId || !org || !plan) return;
        setIsRenewing(true);
        try {
            const result = await startH360Payment(
                orgId, 
                plan.tier, 
                plan.priceMonthlyZAR,
                auth.currentUser?.email || undefined
            );

            if (result.success && result.paymentData) {
                const form = document.createElement('form');
                form.action = result.payfastUrl!;
                form.method = 'POST';

                for (const [key, value] of Object.entries(result.paymentData)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = String(value);
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
            } else {
                throw new Error(result.error || "Failed to initialize payment");
            }
        } catch (err) {
            console.error("Renewal Error:", err);
            alert("Could not start payment process. Please try again.");
            setIsRenewing(false);
        }
    };

    const handlePlanChangeAction = async () => {
        if (!orgId || !selectedUpgradePlan || !org || !plan) return;
        setIsRenewing(true);

        const isUpgrade = selectedUpgradePlan.priceMonthlyZAR > plan.priceMonthlyZAR;

        try {
            if (isUpgrade) {
                const result = await startH360Payment(
                    orgId,
                    selectedUpgradePlan.tier,
                    selectedUpgradePlan.priceMonthlyZAR,
                    auth.currentUser?.email || undefined
                );

                if (result.success && result.paymentData) {
                    const form = document.createElement('form');
                    form.action = result.payfastUrl!;
                    form.method = 'POST';

                    for (const [key, value] of Object.entries(result.paymentData)) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = String(value);
                        form.appendChild(input);
                    }

                    document.body.appendChild(form);
                    form.submit();
                } else {
                    throw new Error(result.error || "Failed to initialize payment");
                }
            } else {
                // Downgrade logic: apply on next billing cycle by saving pending downgrade
                await updateDoc(doc(db, "organizations", orgId), {
                    pendingDowngradeTier: selectedUpgradePlan.tier
                });
                setIsUpgradeDialogOpen(false);
                setIsRenewing(false);
                alert(`Downgrade to ${selectedUpgradePlan.name} scheduled for the next billing cycle.`);
            }
        } catch (err) {
            console.error("Plan Change Error:", err);
            setIsRenewing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your organisation's plan and billing status
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                        <Package className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{plan.name}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            R{plan.priceMonthlyZAR.toLocaleString()} / month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        {(org as any).isTrial ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20">Free Trial</Badge>
                        ) : org.status === 'active' ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center mb-2">
                            {(org as any).isTrial ? (
                                <span className="text-primary flex items-center gap-2">
                                    Trialing <CheckCircle2 className="h-5 w-5" />
                                </span>
                            ) : (
                                <>
                                    {org.status === 'active' && <><span className="text-emerald-500">Active</span> <CheckCircle2 className="ml-2 h-5 w-5 text-emerald-500" /></>}
                                    {org.status === 'pending_payment' && <span className="text-amber-500 text-lg">Pending Payment</span>}
                                    {org.status === 'grace_period' && <span className="text-amber-500 text-lg">Grace Period</span>}
                                    {org.status === 'suspended' && <span className="text-rose-500 text-lg">Suspended</span>}
                                </>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {(org as any).isTrial 
                                ? `Trial ends: ${expiryDate ? format(expiryDate, "PPP") : "N/A"}`
                                : org.status === 'active' 
                                    ? `Next billing date: ${expiryDate ? format(expiryDate, "PPP") : "N/A"}` 
                                    : `Expires: ${expiryDate ? format(expiryDate, "PPP") : "N/A"}`
                            }
                        </p>
                        {(org.status !== 'active' || (org as any).isTrial) && (
                            <Button size="sm" className="mt-4 w-full h-9 font-bold shadow-lg shadow-primary/10" onClick={handleRenew} disabled={isRenewing}>
                                {isRenewing ? "Redirecting..." : (org as any).isTrial ? "Upgrade Now" : "Pay via PayFast"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Auto-Renew</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Enabled</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Charge to VISA •••• 4242
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Plan Usage</CardTitle>
                        <CardDescription>Screenings and user capacity for your plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Active Screenings</span>
                                <span className="font-medium">{org.allowedIllnesses.length} / {plan.maxIllnesses}</span>
                            </div>
                            <Progress value={usagePercent} className="h-2" />
                        </div>
                        {plan.maxUsers > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Max Users</span>
                                    <span className="font-medium">{plan.maxUsers}</span>
                                </div>
                            </div>
                        )}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            You have used {org.allowedIllnesses.length} of {plan.maxIllnesses} screening slots{plan.maxUsers ? ` and can have up to ${plan.maxUsers} users` : ''} in your {plan.name}.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => setIsUpgradeDialogOpen(true)}>
                            Change Plan
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Plan Benefits</CardTitle>
                        <CardDescription>Included in your current subscription</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center text-sm">
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" /> Billing History
                    </CardTitle>
                    <CardDescription>Recent transactions and invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed">
                        <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                        <p>No billing history found for this organisation yet.</p>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Change Subscription Plan</DialogTitle>
                        <DialogDescription>
                            Select a new plan to upgrade or downgrade your organisation's access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 md:grid-cols-3">
                        {allPlans.map((p) => {
                            const isCurrent = p.id === plan.id;
                            const isSelected = selectedUpgradePlan?.id === p.id;
                            return (
                                <Card
                                    key={p.id}
                                    className={`cursor-pointer transition-all ${isCurrent ? "border-slate-200 bg-slate-50 opacity-60" :
                                        isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-slate-200 hover:border-slate-400"
                                        }`}
                                    onClick={() => !isCurrent && setSelectedUpgradePlan(p)}
                                >
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">{p.name}</CardTitle>
                                        <CardDescription className="text-xs">{p.maxIllnesses} Illnesses</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="font-bold text-lg mb-1">R{p.priceMonthlyZAR}</div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{p.tier} Tier</p>
                                        {isCurrent && <Badge variant="secondary" className="mt-2 w-full justify-center">Current Plan</Badge>}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                    {selectedUpgradePlan && (
                        <div className="text-sm rounded-lg bg-slate-50 p-4 border border-slate-200">
                            {selectedUpgradePlan.priceMonthlyZAR > plan.priceMonthlyZAR
                                ? `Upgrading to ${selectedUpgradePlan.name} will charge R${selectedUpgradePlan.priceMonthlyZAR} right now via PayFast and immediately upgrade your limits.`
                                : `Downgrading to ${selectedUpgradePlan.name} will take effect on your next billing cycle.`
                            }
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handlePlanChangeAction} disabled={!selectedUpgradePlan || isRenewing}>
                            {isRenewing
                                ? "Processing..."
                                : selectedUpgradePlan && selectedUpgradePlan.priceMonthlyZAR > plan.priceMonthlyZAR
                                    ? "Pay to Upgrade"
                                    : "Confirm Downgrade"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
