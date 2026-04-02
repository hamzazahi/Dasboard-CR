"use client";

import React from "react";
import { createPortal } from 'react-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ScreeningType {
    label: string;
    count: number;
    value: number;
}

interface ScreeningTypesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ScreeningType[];
    loading?: boolean;
}

const ScreeningTypesModal: React.FC<ScreeningTypesModalProps> = ({
    open,
    onOpenChange,
    data,
    loading = false,
}) => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const filteredData = React.useMemo(() => {
        return data.filter((item) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const totalCount = React.useMemo(() => {
        return data.reduce((acc, item) => acc + item.count, 0);
    }, [data]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
            <div className="relative z-10 w-[95vw] max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-8 pb-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex-none relative flex items-center gap-6">
                    <button 
                        onClick={() => onOpenChange(false)} 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
                            <ClipboardList className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Screening Type Distribution</h2>
                            <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-[0.2em] mt-1">
                                Platform-wide breakdown of {totalCount.toLocaleString()} total screenings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 flex flex-1 flex-col min-h-0 bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="py-6 bg-white dark:bg-slate-950 flex-none">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by screening type name or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-base focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner mb-6" style={{ maxHeight: '50vh' }}>
                        <Table className="relative">
                            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-20 shadow-sm border-b border-slate-200 dark:border-slate-800">
                                <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest py-4">Screening Type</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest text-right py-4">Count</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest py-4 pl-8">Platform Share</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest text-right py-4 pr-6">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((item, idx) => (
                                        <TableRow key={item.label} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800/60">
                                            <TableCell className="py-4 font-bold text-slate-700 dark:text-slate-300">
                                                {item.label}
                                            </TableCell>
                                            <TableCell className="text-right font-black py-4">
                                                {item.count.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="pl-8 py-4 min-w-[200px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ease-out rounded-full bg-primary`}
                                                            style={{ width: `${item.value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-6">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary`}>
                                                    {item.value}%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    <Filter className="w-8 h-8" />
                                                </div>
                                                <p className="font-bold">No screening types found matching "{searchTerm}"</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pb-8 pt-0 flex-none bg-white dark:bg-slate-950">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <ClipboardList className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Total Unique Screening Methods</span>
                        </div>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{data.length}</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ScreeningTypesModal;
