"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, secondaryAuth } from "@/lib/firebase";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    Users,
    Search,
    Shield,
    UserCheck,
    UserX,
    Building2,
    Mail,
    Pencil,
    Loader2,
    Plus,
    Trash2,
    Eye,
    EyeOff,
} from "lucide-react";
import { format } from "date-fns";

interface PlatformUser {
    id: string;
    name: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
    fullPhone: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    signInMethod: string;
    orgId: string;
    photoURL: string;
    createdAt: any;
    lastLogin: any;
}

interface Organization {
    id: string;
    orgName: string;
    planTier: string;
    status: string;
    allowedIllnesses: string[];
}

export default function PlatformUsersPage() {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [plans, setPlans] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [userSearch, setUserSearch] = useState("");
    const [orgSearch, setOrgSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [orgFilter, setOrgFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add Organisation State
    const [isAddOrgDialogOpen, setIsAddOrgDialogOpen] = useState(false);
    const [newOrg, setNewOrg] = useState({ orgName: "", planTier: "" });

    // Add User State
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "patient", orgId: "none" });
    const [showUserPassword, setShowUserPassword] = useState(false);

    // Delete User State
    const [userToDelete, setUserToDelete] = useState<PlatformUser | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch users
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const fetchedUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PlatformUser[];
            // Sort locally to ensure documents without createdAt are not excluded
            fetchedUsers.sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
                return timeB - timeA;
            });
            setUsers(fetchedUsers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch organizations
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "organizations"), (snapshot) => {
            setOrganizations(
                snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Organization[]
            );
        });
        return () => unsubscribe();
    }, []);

    // Fetch plans
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "plans"), (snapshot) => {
            const p: Record<string, any> = {};
            snapshot.docs.forEach((doc) => { p[doc.id] = doc.data(); });
            setPlans(p);
        });
        return () => unsubscribe();
    }, []);

    // Org name lookup
    const orgMap = useMemo(() => {
        const m: Record<string, string> = {};
        organizations.forEach((o) => { m[o.id] = o.orgName || o.id; });
        return m;
    }, [organizations]);

    // User counts per org
    const userCountByOrg = useMemo(() => {
        const counts: Record<string, number> = {};
        users.forEach((u) => {
            if (u.orgId) counts[u.orgId] = (counts[u.orgId] || 0) + 1;
        });
        return counts;
    }, [users]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                userSearch === "" ||
                user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                user.email?.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            const matchesOrg = orgFilter === "all" || user.orgId === orgFilter;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && user.isActive) ||
                (statusFilter === "inactive" && !user.isActive);
            return matchesSearch && matchesRole && matchesOrg && matchesStatus;
        });
    }, [users, userSearch, roleFilter, orgFilter, statusFilter]);

    // Filtered orgs
    const filteredOrgs = useMemo(() => {
        return organizations.filter((org) => {
            return (
                orgSearch === "" ||
                org.orgName?.toLowerCase().includes(orgSearch.toLowerCase()) ||
                org.id.toLowerCase().includes(orgSearch.toLowerCase())
            );
        });
    }, [organizations, orgSearch]);

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const adminUsers = users.filter(
        (u) => u.role === "platform_admin" || u.role === "org_admin"
    ).length;

    const handleEdit = (user: PlatformUser) => {
        setEditingUser({ ...user });
        setIsEditDialogOpen(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, "users", editingUser.id), {
                role: editingUser.role,
                isActive: editingUser.isActive,
            });
            toast.success("User updated successfully");
            setIsEditDialogOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleUserStatus = async (user: PlatformUser) => {
        try {
            await updateDoc(doc(db, "users", user.id), { isActive: !user.isActive });
            toast.success(`User ${!user.isActive ? "activated" : "deactivated"}`);
        } catch (error) {
            toast.error("Failed to update user status");
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch("/api/delete-user", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: userToDelete.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to delete user");
            toast.success(`User "${userToDelete.name || userToDelete.email}" deleted successfully`);
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error(error.message || "Failed to delete user");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddOrg = async () => {
        if (!newOrg.orgName || !newOrg.planTier) {
            toast.error("Please fill in both name and plan.");
            return;
        }
        setIsSubmitting(true);
        try {
            const orgRef = doc(collection(db, "organizations"));
            await setDoc(orgRef, {
                orgName: newOrg.orgName,
                planTier: newOrg.planTier,
                status: "active",
                allowedIllnesses: [],
                createdAt: serverTimestamp(),
            });
            toast.success("Organisation created successfully");
            setIsAddOrgDialogOpen(false);
            setNewOrg({ orgName: "", planTier: "" });
        } catch (error: any) {
            console.error("Error creating org:", error);
            toast.error(error.message || "Failed to create organisation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            toast.error("Please fill in name, email, and password.");
            return;
        }
        setIsSubmitting(true);
        try {
            // 1. Create user in Firebase Auth using secondary app (prevents logging out the admin)
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
            const user = userCredential.user;

            // 2. Update display name
            await updateProfile(user, { displayName: newUser.name });

            // 3. Save to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                orgId: newUser.orgId === "none" ? null : newUser.orgId,
                signInMethod: "email",
                isActive: true,
                isVerified: false,
                createdAt: serverTimestamp(),
                lastLogin: null,
            });

            // 4. Sign out the secondary app purely for cleanup
            await secondaryAuth.signOut();

            toast.success("User created successfully");
            setIsAddUserDialogOpen(false);
            setNewUser({ name: "", email: "", password: "", role: "patient", orgId: "none" });
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast.error(error.message || "Failed to create user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "platform_admin":
                return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Platform Admin</Badge>;
            case "org_admin":
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Org Admin</Badge>;
            case "doctor":
                return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Doctor</Badge>;
            case "patient":
                return <Badge variant="secondary">Patient</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    const getSignInIcon = (method: string) => {
        const icons: Record<string, { icon: string; label: string }> = {
            google: { icon: "🔵", label: "Google" },
            apple: { icon: "🍎", label: "Apple" },
            facebook: { icon: "📘", label: "Facebook" },
            email: { icon: "✉️", label: "Email" },
        };
        const entry = icons[method] || { icon: "✉️", label: method || "Email" };
        return <span title={entry.label} className="cursor-default">{entry.icon}</span>;
    };

    // Handle both Firestore Timestamps and ISO strings
    const parseDate = (val: any, fallback = "—"): string => {
        if (!val) return fallback;
        if (val.toDate) return format(val.toDate(), "dd MMM yyyy");
        if (typeof val === "string") {
            const d = new Date(val);
            return isNaN(d.getTime()) ? fallback : format(d, "dd MMM yyyy");
        }
        if (val instanceof Date) return format(val, "dd MMM yyyy");
        return fallback;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Users</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage organisations and users across the platform
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{activeUsers}</div></CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{adminUsers}</div></CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Organisations</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{organizations.length}</div></CardContent>
                </Card>
            </div>

            {/* ─── ORGANISATIONS TABLE ─── */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center justify-between flex-1">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" /> Organisations ({filteredOrgs.length})
                                </CardTitle>
                                <CardDescription>All registered organisations and their plan usage</CardDescription>
                            </div>
                            {/* <Button size="sm" onClick={() => setIsAddOrgDialogOpen(true)} className="flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Add Organisation
                            </Button> */}
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search organisations..."
                                value={orgSearch}
                                onChange={(e) => setOrgSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organisation</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Screenings</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                        No organisations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrgs.map((org) => {
                                    const planKey = org.planTier ? `${org.planTier}_plan` : null;
                                    const plan = planKey ? plans[planKey] : null;
                                    const userCount = userCountByOrg[org.id] || 0;
                                    const maxUsers = plan?.maxUsers || 0;
                                    const maxScreenings = plan?.maxIllnesses || 0;
                                    const activeScreenings = org.allowedIllnesses?.length || 0;

                                    return (
                                        <TableRow key={org.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{org.orgName}</div>
                                                    <div className="text-xs text-slate-500">{org.id}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {plan?.name || org.planTier || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={userCount >= maxUsers && maxUsers > 0 ? "text-rose-600 font-semibold" : ""}>
                                                    {userCount}
                                                </span>
                                                {maxUsers > 0 && <span className="text-slate-400"> / {maxUsers}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {activeScreenings}
                                                {maxScreenings > 0 && <span className="text-slate-400"> / {maxScreenings}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {org.status === "active" ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{org.status || "—"}</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ─── USERS TABLE ─── */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center justify-between flex-1">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" /> Users ({filteredUsers.length})
                                </CardTitle>
                                <CardDescription>
                                    {filteredUsers.length === users.length
                                        ? "All platform users"
                                        : `Showing ${filteredUsers.length} of ${users.length} users`}
                                </CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setIsAddUserDialogOpen(true)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="h-4 w-4" /> Add User
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* User Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="platform_admin">Platform Admin</SelectItem>
                                <SelectItem value="org_admin">Org Admin</SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="patient">Patient</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={orgFilter} onValueChange={setOrgFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Organisation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Orgs</SelectItem>
                                {Object.entries(orgMap).map(([id, name]) => (
                                    <SelectItem key={id} value={id}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Sign-In Method</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                        No users found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{user.name || user.email?.split("@")[0] || "Unknown"}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                                        <TableCell>{getSignInIcon(user.signInMethod)}</TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {parseDate(user.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {parseDate(user.lastLogin, "Never")}
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(user)}
                                                    title={user.isActive ? "Deactivate" : "Activate"}>
                                                    {user.isActive ? <UserX className="h-4 w-4 text-rose-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setUserToDelete(user); setIsDeleteDialogOpen(true); }}
                                                    title="Delete user"
                                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user role and status.</DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">User</Label>
                                <div className="font-medium">{editingUser.name}</div>
                                <p className="text-xs text-slate-500">{editingUser.email}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Organisation</Label>
                                <div className="text-sm">
                                    {editingUser.orgId ? (orgMap[editingUser.orgId] || editingUser.orgId) : "No organisation"}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Role</Label>
                                <Select value={editingUser.role} onValueChange={(val) => setEditingUser({ ...editingUser, role: val })}>
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="patient">Patient</SelectItem>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="org_admin">Org Admin</SelectItem>
                                        <SelectItem value="platform_admin">Platform Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Status</Label>
                                <Select value={editingUser.isActive ? "active" : "inactive"}
                                    onValueChange={(val) => setEditingUser({ ...editingUser, isActive: val === "active" })}>
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveUser} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Organisation Dialog */}
            <Dialog open={isAddOrgDialogOpen} onOpenChange={setIsAddOrgDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Organisation</DialogTitle>
                        <DialogDescription>Create a new organisation in the system.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="orgName" className="text-right">Name</Label>
                            <Input
                                id="orgName"
                                value={newOrg.orgName}
                                onChange={(e) => setNewOrg({ ...newOrg, orgName: e.target.value })}
                                placeholder="E.g., Acme Clinic"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Plan Tier</Label>
                            <Select value={newOrg.planTier} onValueChange={(val) => setNewOrg({ ...newOrg, planTier: val })}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select plan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="small">Package 1 (Small)</SelectItem>
                                    <SelectItem value="medium">Package 2 (Medium)</SelectItem>
                                    <SelectItem value="full">Package 3 (Full)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOrgDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddOrg} disabled={isSubmitting || !newOrg.orgName || !newOrg.planTier}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Add Organisation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Platform User</DialogTitle>
                        <DialogDescription>Create a new user with proper Firebase Auth credentials.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="Full Name"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="name@example.com"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Password</Label>
                            <div className="relative col-span-3">
                                <Input
                                    type={showUserPassword ? "text" : "password"}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowUserPassword(!showUserPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Role</Label>
                            <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="patient">Patient</SelectItem>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="org_admin">Org Admin</SelectItem>
                                    <SelectItem value="platform_admin">Platform Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {["org_admin", "doctor"].includes(newUser.role) && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Org</Label>
                                <Select value={newUser.orgId} onValueChange={(val) => setNewUser({ ...newUser, orgId: val })}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Organisation" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {Object.entries(orgMap).map(([id, name]) => (
                                            <SelectItem key={id} value={id}>{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={isSubmitting || !newUser.name || !newUser.email || !newUser.password}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Add User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!isDeleting) { setIsDeleteDialogOpen(open); if (!open) setUserToDelete(null); } }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Delete User
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{userToDelete?.name || userToDelete?.email}</strong> from both Firebase Authentication and Firestore. This action <strong>cannot be undone</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" /> Delete Permanently</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
