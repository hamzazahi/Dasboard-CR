"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Plus,
    Edit2,
    Stethoscope,
    Filter,
    Trash2,
    Loader2,
    CheckCircle2,
    ClipboardList,
    ChevronDown
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    addDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Illness {
    id: string;
    displayName: string;
    category: string;
    specialist: string;
    isActive: boolean;
}

const ILLNESS_CATEGORIES = [
    "Cardiovascular",
    "Metabolic",
    "Mental Health",
    "Infectious Disease",
    "Respiratory",
    "Musculoskeletal",
    "Hearing",
    "Oncology",
    "Neurological",
    "Other",
];

export default function IllnessLibraryPage() {
    const router = useRouter();
    const [illnesses, setIllnesses] = useState<Illness[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIllness, setEditingIllness] = useState<Partial<Illness> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "illness_library")); // Removed orderBy to ensure all documents appear even with mixed fields

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const illnessData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    displayName: data.displayName || data.name || "Unnamed Condition",
                    category: data.category || "Uncategorized",
                    specialist: data.specialist || "Not specified",
                    isActive: data.isActive ?? true,
                } as Illness;
            });
            // Sort client-side for consistency
            illnessData.sort((a, b) => a.displayName.localeCompare(b.displayName));
            setIllnesses(illnessData);
            setLoading(false);
        }, (error) => {
            console.error("Illness Library subscription error:", error);
            toast.error("Failed to sync illness library data");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!editingIllness?.displayName || !editingIllness?.category) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingIllness.id) {
                // Update
                const ref = doc(db, "illness_library", editingIllness.id);
                await updateDoc(ref, {
                    displayName: editingIllness.displayName,
                    category: editingIllness.category,
                    specialist: editingIllness.specialist || "",
                    isActive: editingIllness.isActive ?? true,
                });
                toast.success("Condition updated");
            } else {
                // Create
                await addDoc(collection(db, "illness_library"), {
                    displayName: editingIllness.displayName,
                    category: editingIllness.category,
                    specialist: editingIllness.specialist || "",
                    isActive: editingIllness.isActive ?? true,
                    createdAt: new Date().toISOString()
                });
                toast.success("Condition added");
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save condition");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this condition?")) return;

        try {
            await deleteDoc(doc(db, "illness_library", id));
            toast.success("Condition deleted");
        } catch (error) {
            toast.error("Failed to delete condition");
        }
    };

    const filteredIllnesses = illnesses.filter(illness =>
        illness.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        illness.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Illness Library</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage the global database of conditions and screening questions.</p>
                </div>
                <Button
                    className="font-semibold shadow-sm"
                    onClick={() => {
                        setEditingIllness({ displayName: "", category: "", specialist: "", isActive: true });
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add New Condition
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {[
                    { label: "Total Conditions", value: illnesses.length, icon: Stethoscope, trend: "Global Database", trendColor: "text-slate-500" },
                    { label: "Active Conditions", value: illnesses.filter(i => i.isActive).length, icon: CheckCircle2, trend: "Currently Available", trendColor: "text-emerald-500" },
                    { label: "Unique Categories", value: new Set(illnesses.map(i => i.category)).size, icon: Filter, trend: "Medical Domains", trendColor: "text-blue-500" },
                ].map((stat, i) => (
                    <Card key={i} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                        <CardContent className="p-0">
                            {/* Top Section */}
                            <div className="p-6 flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                                        {loading ? (
                                            <Skeleton className="h-9 w-16 mt-1" />
                                        ) : stat.value}
                                    </div>
                                </div>
                                <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            
                            {/* Footer Section */}
                            <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="ghost" className={`text-[10px] p-0 font-bold uppercase tracking-tight ${stat.trendColor}`}>
                                        {stat.trend}
                                    </Badge>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase">Library Stat</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search illnesses or categories..."
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
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Condition Name</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Category</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Specialist</TableHead>
                                <TableHead className="font-semibold text-slate-900 dark:text-slate-50">Status</TableHead>
                                <TableHead className="w-[120px] text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" /></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))
                            ) : (() => {
                                const grouped: Record<string, typeof filteredIllnesses> = {};
                                filteredIllnesses.forEach((illness) => {
                                    const cat = illness.category || "Uncategorized";
                                    if (!grouped[cat]) grouped[cat] = [];
                                    grouped[cat].push(illness);
                                });
                                return Object.entries(grouped).map(([category, items]) => (
                                    <React.Fragment key={category}>
                                        <TableRow className="bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                                            <TableCell colSpan={5} className="py-2 px-4">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{category}</span>
                                                <span className="ml-2 text-xs text-slate-400">({items.length})</span>
                                            </TableCell>
                                        </TableRow>
                                        {items.map((illness) => (
                                            <TableRow key={illness.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                                <TableCell className="font-medium py-4 pl-8 text-slate-900 dark:text-slate-50">
                                                    {illness.displayName}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border-none capitalize">
                                                        {illness.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500 dark:text-slate-400">{illness.specialist}</TableCell>
                                                <TableCell>
                                                    {illness.isActive ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-2 shadow-none">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-none px-2 shadow-none">Inactive</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-4 pr-6">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                                            title="Manage Questions"
                                                            onClick={() => router.push(`/admin/illness-library/${illness.id}/questions`)}
                                                        >
                                                            <ClipboardList className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                                            onClick={() => {
                                                                setEditingIllness(illness);
                                                                setIsDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                                            onClick={() => handleDelete(illness.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ));
                            })()}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingIllness?.id ? "Edit Condition" : "Add New Condition"}</DialogTitle>
                        <DialogDescription>
                            Configure the condition details for the global illness library.
                        </DialogDescription>
                    </DialogHeader>
                    {editingIllness && (
                        <div className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Type 2 Diabetes"
                                    value={editingIllness.displayName}
                                    onChange={(e) => setEditingIllness({ ...editingIllness, displayName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={editingIllness.category || ""}
                                    onValueChange={(val) => setEditingIllness({ ...editingIllness, category: val })}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ILLNESS_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="specialist">Specialist Type</Label>
                                <Input
                                    id="specialist"
                                    placeholder="e.g. Endocrinologist"
                                    value={editingIllness.specialist}
                                    onChange={(e) => setEditingIllness({ ...editingIllness, specialist: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <Label htmlFor="isActive" className="text-sm font-medium leading-none cursor-pointer">
                                    Condition is active and available for selection
                                </Label>
                                <Switch
                                    id="isActive"
                                    checked={editingIllness.isActive}
                                    onCheckedChange={(checked) => setEditingIllness({ ...editingIllness, isActive: checked })}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingIllness?.id ? "Update Condition" : "Add Condition"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
