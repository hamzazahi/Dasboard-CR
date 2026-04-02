"use client";

import React from "react";
import { X, RotateCcw, Paintbrush, Moon, Sun, Monitor } from "lucide-react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

interface ThemeSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRIMARY_COLORS = [
    { name: "Emerald (Default)", value: "#00C896" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Orange", value: "#f59e0b" },
];

export function ThemeSettings({ open, onOpenChange }: ThemeSettingsProps) {
    const { 
        colorScheme, 
        setColorScheme, 
        primaryColor, 
        setPrimaryColor,
        sidebarSize,
        setSidebarSize,
        resetTheme 
    } = useTheme();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="p-0 sm:max-w-sm flex flex-col gap-0 border-l" showCloseButton={false}>
                <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Paintbrush className="w-5 h-5" />
                        <h2 className="text-xl font-bold tracking-tight">Theme Settings</h2>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onOpenChange(false)}
                        className="text-primary-foreground hover:bg-black/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Color Scheme */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color Scheme</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setColorScheme("light")}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                    colorScheme === "light" 
                                        ? "border-primary bg-primary/5 shadow-sm" 
                                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    colorScheme === "light" ? "border-primary" : "border-muted-foreground"
                                )}>
                                    {colorScheme === "light" && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                    <Sun className="w-4 h-4" />
                                    <span>Light</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setColorScheme("dark")}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                    colorScheme === "dark" 
                                        ? "border-primary bg-primary/5 shadow-sm" 
                                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    colorScheme === "dark" ? "border-primary" : "border-muted-foreground"
                                )}>
                                    {colorScheme === "dark" && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                    <Moon className="w-4 h-4" />
                                    <span>Dark</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Primary Color Picker */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform Color</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {PRIMARY_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setPrimaryColor(color.value)}
                                    className={cn(
                                        "group flex flex-col items-center gap-2 p-2 rounded-xl transition-all",
                                        primaryColor === color.value 
                                            ? "bg-primary/5 scale-105" 
                                            : "hover:bg-muted/30"
                                    )}
                                >
                                    <div 
                                        className={cn(
                                            "w-10 h-10 rounded-full border-4 shadow-sm transition-transform group-hover:scale-110",
                                            primaryColor === color.value ? "border-white dark:border-slate-800 ring-2 ring-primary" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: color.value }}
                                    />
                                    <span className="text-[10px] font-medium text-center leading-tight">{color.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Sidebar Size */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sidebar Layout</Label>
                        <div className="space-y-2">
                            {[
                                { id: "default", label: "Default Size" },
                                { id: "condensed", label: "Condensed" },
                                { id: "hidden", label: "Auto-Hide" }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setSidebarSize(option.id as any)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                                        sidebarSize === option.id 
                                            ? "border-primary bg-primary/5" 
                                            : "border-transparent bg-muted/30 hover:bg-muted/50"
                                    )}
                                >
                                    <span className="font-medium">{option.label}</span>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                        sidebarSize === option.id ? "border-primary" : "border-muted-foreground"
                                    )}>
                                        {sidebarSize === option.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-muted/10">
                    <Button 
                        variant="destructive" 
                        className="w-full gap-2 py-6 rounded-xl text-md font-bold shadow-xl shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={resetTheme}
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset Defaults
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
