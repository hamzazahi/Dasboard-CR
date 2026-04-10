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
    CardHeader,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    MoreHorizontal,
    Search,
    Filter,
    Plus,
    ExternalLink,
    Ban,
    CheckCircle2,
    Trash2,
    Loader2,
    AlertCircle,
    Calendar,
    Shield,
    Mail,
    Eye,
    EyeOff,
    Building2,
    Stethoscope,
    AlertTriangle,
    Copy,
    Check,
} from "lucide-react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    setDoc,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import { db, secondaryAuth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { format } from "date-fns";

interface Organisation {
    id: string;
    orgName: string;
    planTier: string;
    status: "active" | "suspended" | "pending";
    ownerUid?: string;
    createdAt: any;
    subscriptionExpiresAt?: any;
    allowedIllnesses?: string[];
    branding?: {
        appName?: string;
        primaryColor?: string;
        logoUrl?: string;
    };
    revenue?: number;
}

export default function OrganisationsPage() {
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // --- Add Organisation Dialog State ---
    const [dialogOpen, setDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState("");
    const [showOrgPassword, setShowOrgPassword] = useState(false);
    const [formData, setFormData] = useState({
        orgName: "",
        adminEmail: "",
        adminPassword: "",
        planTier: "small"
    });

    // --- View Details Dialog State ---
    const [viewOrg, setViewOrg] = useState<Organisation | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

    // --- Delete Confirm Dialog State ---
    const [deleteOrg, setDeleteOrg] = useState<Organisation | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // --- Suspend / Reactivate loading ---
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // --- Copy ID feedback ---
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    useEffect(() => {
        const q = query(collection(db, "organizations"), orderBy("orgName", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orgsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Organisation[];
            setOrganisations(orgsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredOrgs = organisations.filter(org =>
        org.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ===================== HANDLERS =====================

    // --- Create Organisation ---
    const handleCreateOrganisation = async () => {
        if (!formData.orgName.trim() || !formData.adminEmail.trim() || !formData.adminPassword.trim()) {
            setCreateError("All fields are required.");
            return;
        }
        if (formData.adminPassword.length < 6) {
            setCreateError("Password must be at least 6 characters.");
            return;
        }

        setCreating(true);
        setCreateError("");
        setCreateSuccess("");

        try {
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                formData.adminEmail.trim(),
                formData.adminPassword
            );
            const newUser = userCredential.user;
            await signOut(secondaryAuth);

            const orgId = `org_${newUser.uid.substring(0, 8)}_${Date.now()}`;

            await setDoc(doc(db, "users", newUser.uid), {
                email: formData.adminEmail.trim(),
                role: "org_admin",
                orgId: orgId,
                displayName: formData.orgName.trim(),
                createdAt: new Date().toISOString(),
            });

            const defaultIllnesses = formData.planTier === "full" ? ["all"] : ["tb", "hypertension", "diabetes"];
            await setDoc(doc(db, "organizations", orgId), {
                orgName: formData.orgName.trim(),
                ownerUid: newUser.uid,
                status: "active",
                planTier: formData.planTier,
                createdAt: new Date().toISOString(),
                subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                allowedIllnesses: defaultIllnesses,
                branding: {
                    appName: formData.orgName.trim(),
                    primaryColor: "#0F172A",
                    secondaryColor: "#334155",
                    logoUrl: "",
                    welcomeMessage: `Welcome to ${formData.orgName.trim()}`,
                    disclaimerText: "This is a screening tool. Please consult a doctor for a full diagnosis."
                },
                qrCode: `https://h360.app/org/${orgId}`,
                currency: "ZAR"
            });

            setCreateSuccess(`Organisation "${formData.orgName.trim()}" created successfully!`);
            setFormData({ orgName: "", adminEmail: "", adminPassword: "", planTier: "small" });
            setTimeout(() => { setDialogOpen(false); setCreateSuccess(""); }, 1500);
        } catch (err: any) {
            console.error("Error creating organisation:", err);
            if (err.code === "auth/email-already-in-use") {
                setCreateError("This email is already registered.");
            } else if (err.code === "auth/invalid-email") {
                setCreateError("Please enter a valid email address.");
            } else {
                setCreateError(err.message || "Failed to create organisation.");
            }
        } finally {
            setCreating(false);
        }
    };

    // --- View Details ---
    const handleViewDetails = async (org: Organisation) => {
        setViewOrg(org);
        setOwnerEmail(null);
        setViewDialogOpen(true);

        // Fetch owner email
        if (org.ownerUid) {
            try {
                const userDoc = await getDoc(doc(db, "users", org.ownerUid));
                if (userDoc.exists()) {
                    setOwnerEmail(userDoc.data().email || "N/A");
                }
            } catch (err) {
                console.error("Error fetching owner:", err);
            }
        }
    };

    // --- Suspend Organisation ---
    const handleSuspend = async (org: Organisation) => {
        setActionLoading(org.id);
        try {
            await updateDoc(doc(db, "organizations", org.id), {
                status: "suspended"
            });
        } catch (err) {
            console.error("Error suspending org:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // --- Reactivate Organisation ---
    const handleReactivate = async (org: Organisation) => {
        setActionLoading(org.id);
        try {
            await updateDoc(doc(db, "organizations", org.id), {
                status: "active"
            });
        } catch (err) {
            console.error("Error reactivating org:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // --- Delete Organisation ---
    const handleDelete = async () => {
        if (!deleteOrg) return;
        setDeleting(true);
        try {
            // Call server-side API: deletes all user Auth accounts + Firestore docs,
            // screening_attempts, transactions, and the org document itself
            const response = await fetch("/api/delete-org", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId: deleteOrg.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to delete organisation");

            setDeleteDialogOpen(false);
            setDeleteOrg(null);
        } catch (err: any) {
            console.error("Error deleting org:", err);
            alert(err.message || "Failed to delete organisation. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    // ===================== BADGES =====================

    const getStatusBadge = (org: Organisation) => {
        if ((org as any).isTrial) {
            return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">Trial</Badge>;
        }
        switch (org.status) {
            case "active":
                return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none">Active</Badge>;
            case "suspended":
                return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none">Suspended</Badge>;
            default:
                return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-none">Pending</Badge>;
        }
    };

    const getTierBadge = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case "full":
                return <Badge variant="outline" className="border-primary text-primary">Full Plan</Badge>;
            case "medium":
                return <Badge variant="outline" className="border-blue-500 text-blue-500">Medium Plan</Badge>;
            default:
                return <Badge variant="outline">Small Plan</Badge>;
        }
    };

    /** Format a date value from Firestore (string or Timestamp) */
    const formatDate = (value: any) => {
        if (!value) return "N/A";
        try {
            const date = value.toDate ? value.toDate() : new Date(value);
            return format(date, "dd MMM yyyy, HH:mm");
        } catch {
            return "N/A";
        }
    };

    // ===================== RENDER =====================

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Organisations</h1>
                    <p className="text-muted-foreground">Manage and monitor all platform tenants from here.</p>
                </div>

                {/* ========== ADD ORGANISATION DIALOG ========== */}
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) { setCreateError(""); setCreateSuccess(""); }
                }}>
                    <DialogTrigger asChild>
                        <Button className="font-semibold shadow-sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Organisation
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New Organisation</DialogTitle>
                            <DialogDescription>
                                Create a new organisation and its admin account. The admin will be able to log in immediately.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="orgName">Organisation Name</Label>
                                <Input id="orgName" placeholder="e.g. BestMed Clinic" value={formData.orgName}
                                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })} disabled={creating} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adminEmail">Admin Email</Label>
                                <Input id="adminEmail" type="email" placeholder="admin@bestmed.co.za" value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} disabled={creating} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adminPassword">Admin Password</Label>
                                <div className="relative">
                                    <Input id="adminPassword" type={showOrgPassword ? "text" : "password"} placeholder="Minimum 6 characters" value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} disabled={creating} className="pr-10" />
                                    <button
                                        type="button"
                                        onClick={() => setShowOrgPassword(!showOrgPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showOrgPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="planTier">Plan Tier</Label>
                                <Select value={formData.planTier} onValueChange={(value) => setFormData({ ...formData, planTier: value })} disabled={creating}>
                                    <SelectTrigger id="planTier"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small Plan</SelectItem>
                                        <SelectItem value="medium">Medium Plan</SelectItem>
                                        <SelectItem value="full">Full Plan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {createError && (
                                <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg">
                                    <AlertCircle className="h-4 w-4 shrink-0" />{createError}
                                </div>
                            )}
                            {createSuccess && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />{createSuccess}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
                            <Button onClick={handleCreateOrganisation} disabled={creating}>
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {creating ? "Creating..." : "Create Organisation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ========== VIEW DETAILS DIALOG ========== */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    {viewOrg && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                        {viewOrg.orgName.substring(0, 2).toUpperCase()}
                                    </div>
                                    {viewOrg.orgName}
                                </DialogTitle>
                                <DialogDescription>Organisation details and configuration.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Organisation ID</p>
                                        <p className="text-sm font-mono bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded break-all">{viewOrg.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Status</p>
                                        <div>{getStatusBadge(viewOrg)}</div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Plan Tier</p>
                                        <div>{getTierBadge(viewOrg.planTier)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Owner Email</p>
                                        <p className="text-sm">{ownerEmail || "Loading..."}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Created At</p>
                                        <p className="text-sm">{formatDate(viewOrg.createdAt)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Subscription Expires</p>
                                        <p className="text-sm">{formatDate(viewOrg.subscriptionExpiresAt)}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Allowed Illnesses</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {(viewOrg.allowedIllnesses || []).length > 0 ? (
                                            viewOrg.allowedIllnesses!.map((illness) => (
                                                <Badge key={illness} variant="secondary" className="text-xs capitalize">
                                                    {illness === "all" ? "All Illnesses" : illness.replace(/_/g, " ")}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">None configured</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ========== DELETE CONFIRM DIALOG ========== */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" /> Delete Organisation
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the organisation
                            <span className="font-semibold text-foreground"> &quot;{deleteOrg?.orgName}&quot;</span> and
                            remove all associated user accounts from the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {deleting ? "Deleting..." : "Delete Organisation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========== TABLE ========== */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-10 h-10 bg-white dark:bg-slate-950"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-10">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[300px] font-semibold">Organisation Name</TableHead>
                                <TableHead className="font-semibold">ID</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Plan Tier</TableHead>
                                <TableHead className="font-semibold text-right">Revenue</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></TableCell>
                                        <TableCell><div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></TableCell>
                                        <TableCell><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded ml-auto" /></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredOrgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No organisations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrgs.map((org) => (
                                    <TableRow key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                        <TableCell className="font-medium flex items-center gap-3 py-4">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {org.orgName.substring(0, 2).toUpperCase()}
                                            </div>
                                            {org.orgName}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 group">
                                                <span className="font-mono text-xs text-slate-500">{org.id}</span>
                                                <button
                                                    onClick={() => handleCopyId(org.id)}
                                                    title="Copy ID"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 shrink-0"
                                                >
                                                    {copiedId === org.id
                                                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        : <Copy className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(org)}</TableCell>
                                        <TableCell>{getTierBadge(org.planTier)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            R{(org.revenue || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {actionLoading === org.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleViewDetails(org)}>
                                                            <ExternalLink className="mr-2 h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        {org.status === "suspended" ? (
                                                            <DropdownMenuItem onClick={() => handleReactivate(org)}>
                                                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Reactivate
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleSuspend(org)} className="text-amber-600">
                                                                <Ban className="mr-2 h-4 w-4" /> Suspend
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-rose-600"
                                                            onClick={() => { setDeleteOrg(org); setDeleteDialogOpen(true); }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
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
