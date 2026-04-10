"use client";

import React, { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Edit2,
    Plus,
    CheckCircle2,
    XCircle,
    Package,
    Layers,
    Zap,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Plan {
    id: string;
    name: string;
    tier: string;
    maxIllnesses: number;
    maxUsers: number;
    questionDepthMultiplier: number;
    priceMonthlyZAR: number;
    priceYearlyZAR: number;
    isActive: boolean;
    features: string[];
    description: string;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "plans"), orderBy("maxIllnesses", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const plansData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Plan[];
            setPlans(plansData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleEdit = (plan: Plan) => {
        setEditingPlan({ ...plan });
        setIsEditDialogOpen(true);
    };

    const handleSavePlan = async () => {
        if (!editingPlan) return;

        setIsSubmitting(true);
        try {
            const planRef = doc(db, "plans", editingPlan.id);
            await updateDoc(planRef, {
                name: editingPlan.name,
                description: editingPlan.description,
                priceMonthlyZAR: Number(editingPlan.priceMonthlyZAR),
                priceYearlyZAR: Number(editingPlan.priceYearlyZAR),
                maxIllnesses: Number(editingPlan.maxIllnesses),
                maxUsers: Number(editingPlan.maxUsers),
                isActive: editingPlan.isActive,
            });
            toast.success("Plan updated successfully");
            setIsEditDialogOpen(false);
        } catch (error) {
            console.error("Error updating plan:", error);
            toast.error("Failed to update plan");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage global subscription tiers and pricing
                    </p>
                </div>
                <Button disabled>
                    <Plus className="mr-2 h-4 w-4" /> Add Plan
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className="relative overflow-hidden border-slate-200 dark:border-slate-800">
                        <div className={`absolute top-0 left-0 w-1 h-full ${plan.tier === "small" ? "bg-blue-500" :
                            plan.tier === "medium" ? "bg-indigo-500" : "bg-purple-500"
                            }`} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant={plan.isActive ? "default" : "secondary"}>
                                    {plan.isActive ? "Active" : "Archived"}
                                </Badge>
                                {plan.tier === "small" && <Package className="h-5 w-5 text-blue-500" />}
                                {plan.tier === "medium" && <Layers className="h-5 w-5 text-indigo-500" />}
                                {plan.tier === "full" && <Zap className="h-5 w-5 text-purple-500" />}
                            </div>
                            <CardTitle className="text-xl mt-2">{plan.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R{plan.priceMonthlyZAR.toLocaleString()}<span className="text-sm font-normal text-slate-500"> /mo</span></div>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                                    {plan.maxUsers || '—'} Users
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                                    {plan.maxIllnesses} Screenings
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                                    {plan.questionDepthMultiplier * 100}% Depth
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle>Plan Details</CardTitle>
                    <CardDescription>Detailed configuration for each subscription tier</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plan Name</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Max Users</TableHead>
                                <TableHead>Max Screenings</TableHead>
                                <TableHead>Depth</TableHead>
                                <TableHead>Monthly (ZAR)</TableHead>
                                <TableHead>Yearly (ZAR)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell className="capitalize">{plan.tier}</TableCell>
                                    <TableCell>{plan.maxUsers || '—'}</TableCell>
                                    <TableCell>{plan.maxIllnesses}</TableCell>
                                    <TableCell>{plan.questionDepthMultiplier * 100}%</TableCell>
                                    <TableCell>R{plan.priceMonthlyZAR.toLocaleString()}</TableCell>
                                    <TableCell>R{plan.priceYearlyZAR.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {plan.isActive ? (
                                            <div className="flex items-center text-emerald-600 dark:text-emerald-500">
                                                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Active
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-slate-500">
                                                <XCircle className="mr-1.5 h-4 w-4" /> Inactive
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle>Option 2 – Pricing Schedule (ZAR)</CardTitle>
                    <CardDescription>Per-user pricing tiers including WLS and H360 components</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Users</TableHead>
                                <TableHead>APP Store</TableHead>
                                <TableHead>WLS/month</TableHead>
                                <TableHead>H360/user</TableHead>
                                <TableHead>TOTAL</TableHead>
                                <TableHead>/user</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { users: "1–5",    appStore: true,  wls: "R49.00",   h360: "R10.00", total: "R99.00",    perUser: "R19.80" },
                                { users: "6–10",   appStore: false, wls: "R59.00",   h360: "R9.50",  total: "R154.00",   perUser: "R15.40" },
                                { users: "11–20",  appStore: false, wls: "R99.00",   h360: "R9.00",  total: "R279.00",   perUser: "R13.95" },
                                { users: "21–30",  appStore: false, wls: "R199.00",  h360: "R8.50",  total: "R454.00",   perUser: "R15.13" },
                                { users: "31–50",  appStore: false, wls: "R299.00",  h360: "R8.00",  total: "R699.00",   perUser: "R13.98" },
                                { users: "51–100", appStore: false, wls: "R399.00",  h360: "R7.50",  total: "R1,149.00", perUser: "R11.49" },
                            ].map((row) => (
                                <TableRow key={row.users}>
                                    <TableCell className="font-medium">{row.users}</TableCell>
                                    <TableCell>{row.appStore ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : "—"}</TableCell>
                                    <TableCell>{row.wls}</TableCell>
                                    <TableCell>{row.h360}</TableCell>
                                    <TableCell className="font-semibold">{row.total}</TableCell>
                                    <TableCell>{row.perUser}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Plan</DialogTitle>
                        <DialogDescription>
                            Make changes to the subscription plan. These will take effect for new subscribers immediately.
                        </DialogDescription>
                    </DialogHeader>
                    {editingPlan && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    value={editingPlan.name}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="monthly" className="text-right">Monthly</Label>
                                <Input
                                    id="monthly"
                                    type="number"
                                    value={editingPlan.priceMonthlyZAR}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthlyZAR: parseInt(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="yearly" className="text-right">Yearly</Label>
                                <Input
                                    id="yearly"
                                    type="number"
                                    value={editingPlan.priceYearlyZAR}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, priceYearlyZAR: parseInt(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="maxUsers" className="text-right">Max Users</Label>
                                <Input
                                    id="maxUsers"
                                    type="number"
                                    value={editingPlan.maxUsers}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, maxUsers: parseInt(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="max" className="text-right">Max Screenings</Label>
                                <Input
                                    id="max"
                                    type="number"
                                    value={editingPlan.maxIllnesses}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, maxIllnesses: parseInt(e.target.value) || 0 })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Input
                                    id="description"
                                    value={editingPlan.description || ""}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePlan} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
