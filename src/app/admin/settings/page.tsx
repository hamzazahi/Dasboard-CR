"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
    updateEmail, 
    updatePassword, 
    reauthenticateWithCredential, 
    EmailAuthProvider 
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    User, 
    Lock, 
    Mail, 
    ShieldCheck, 
    Loader2, 
    AlertCircle, 
    CheckCircle2,
    Eye,
    EyeOff
} from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";

export default function AdminSettingsPage() {
    const user = auth.currentUser;
    const [email, setEmail] = useState(user?.email || "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [isReauthOpen, setIsReauthOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"email" | "password" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleReauth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        setLoading(true);
        setMessage(null);

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            setIsReauthOpen(false);
            setCurrentPassword("");

            if (pendingAction === "email") {
                await performEmailUpdate();
            } else if (pendingAction === "password") {
                await performPasswordUpdate();
            }
        } catch (error: any) {
            console.error("Re-auth error:", error);
            setMessage({ type: "error", text: "Invalid current password. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const triggerEmailUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === user?.email) {
            setMessage({ type: "error", text: "Please enter a different email address." });
            return;
        }
        setPendingAction("email");
        setIsConfirmOpen(true);
    };

    const handleConfirmEmail = () => {
        setIsConfirmOpen(false);
        setIsReauthOpen(true);
    };

    const triggerPasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }
        setPendingAction("password");
        setIsReauthOpen(true);
    };

    const performEmailUpdate = async () => {
        if (!user) return;
        try {
            await updateEmail(user, email);
            await updateDoc(doc(db, "users", user.uid), { email });
            setMessage({ type: "success", text: "Email updated successfully!" });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to update email." });
        }
    };

    const performPasswordUpdate = async () => {
        if (!user) return;
        try {
            await updatePassword(user, newPassword);
            setNewPassword("");
            setConfirmPassword("");
            setMessage({ type: "success", text: "Password updated successfully!" });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to update password." });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your administrator profile and security credentials.</p>
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300",
                    message.type === "success" 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" 
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                )}>
                    {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Settings */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Account Email</CardTitle>
                                <CardDescription>Update your login email address.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <form onSubmit={triggerEmailUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white dark:bg-slate-950 font-medium"
                                    required 
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold">Update Email</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Settings */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Security</CardTitle>
                                <CardDescription>Change your administrator password.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <form onSubmit={triggerPasswordUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-xs font-bold uppercase tracking-widest text-slate-400">New Password</Label>
                                <div className="relative">
                                    <Input 
                                        id="new-password" 
                                        type={showPasswords ? "text" : "password"} 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-white dark:bg-slate-950 pr-10"
                                        required 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-widest text-slate-400">Confirm Password</Label>
                                <Input 
                                    id="confirm-password" 
                                    type={showPasswords ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white dark:bg-slate-950"
                                    required 
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold">Update Password</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-500">
                            <AlertCircle className="w-5 h-5" />
                            Confirm Email Change
                        </DialogTitle>
                        <DialogDescription className="text-slate-200 pt-2">
                            Are you sure you want to change your administrator email to:
                            <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-center">
                                {email}
                            </div>
                            <div className="mt-4 text-xs text-slate-400">
                                This will change your login credentials. You will need to use this new email to sign in next time.
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmEmail} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Yes, I'm Sure
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Re-authentication Dialog */}
            <Dialog open={isReauthOpen} onOpenChange={setIsReauthOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Security Verification
                        </DialogTitle>
                        <DialogDescription>
                            Please enter your current password to confirm these changes.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReauth}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input 
                                    id="current-password" 
                                    type="password" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoFocus
                                    required 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsReauthOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm & Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
