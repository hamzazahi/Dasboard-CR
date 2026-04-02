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
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Users,
    Mail,
    Phone,
    UserCheck,
    CalendarDays
} from "lucide-react";
import {
    collection,
    query,
    where,
    onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";

interface Patient {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt?: any;
}

export default function PatientsManagementPage() {
    const { orgId } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!orgId) return;

        const q = query(
            collection(db, "users"),
            where("orgId", "==", orgId),
            where("role", "==", "patient")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const patientData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Patient[];

            setPatients(patientData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    const filteredPatients = patients.filter(patient =>
        patient.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Patient Roster</h1>
                    <p className="text-slate-500 dark:text-slate-400">View and manage all patients registered to your organization through the mobile app.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Registered Patients</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{loading ? "..." : patients.length}</p>
                            </div>
                            <Users className="h-5 w-5 text-primary opacity-70" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Mobile App Users</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{loading ? "..." : patients.filter(p => p.isActive !== false).length}</p>
                            </div>
                            <UserCheck className="h-5 w-5 text-emerald-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by Patient ID, email or phone..."
                                className="pl-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Patient Information</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Contact info</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Registration Date</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-12 w-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                        No patients found. Users who register on the mobile app using your unique organisation code will appear here.
                                    </TableCell>
                                </TableRow>
                            ) : filteredPatients.map((patient) => (
                                <TableRow key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                                                {patient.id}
                                            </span>
                                            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Users className="w-3 h-3" /> Patient ID
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> {patient.email || "No email"}
                                            </span>
                                            {patient.phone && (
                                                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5" /> {patient.phone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                            <CalendarDays className="w-4 h-4" />
                                            {patient.createdAt?.toDate ? format(patient.createdAt.toDate(), "MMM d, yyyy") :
                                                patient.createdAt ? format(new Date(patient.createdAt), "MMM d, yyyy") : "Unknown"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {patient.isActive !== false ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-2 shadow-none">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-none px-2 shadow-none">Inactive</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
