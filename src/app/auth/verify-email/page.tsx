"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";

export default function VerifyEmailPage() {
    const { user, emailVerified } = useAuth();
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const router = useRouter();

    // Redirect if already verified
    useEffect(() => {
        if (emailVerified) {
            router.push("/auth/onboarding");
        }
    }, [emailVerified, router]);

    // Handle Cooldown Timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (!auth.currentUser || cooldown > 0) return;
        setSending(true);
        setMessage(null);
        try {
            await sendEmailVerification(auth.currentUser);
            setMessage({ type: "success", text: "New verification link sent to your inbox!" });
            setCooldown(60); // 60 second cooldown
        } catch (err: any) {
            if (err.code === "auth/too-many-requests") {
                setMessage({ type: "error", text: "Please wait a minute before requesting another link." });
                setCooldown(60); // Set cooldown even on error to prevent spamming
            } else {
                setMessage({ type: "error", text: err.message || "Failed to resend email." });
            }
        } finally {
            setSending(false);
        }
    };

    const handleCheckStatus = async () => {
        if (!auth.currentUser) return;
        setSending(true);
        try {
            // Force reload user object from Firebase
            await auth.currentUser.reload();
            // Reload page to trigger AuthContext refresh
            window.location.reload();
        } catch (err: any) {
            setMessage({ type: "error", text: "Failed to refresh status. Please try again." });
        } finally {
            setSending(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/auth/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Ambient Background Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#1a2332] pointer-events-none" />
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg relative z-10 shadow-2xl border-sidebar-border bg-sidebar text-white overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                
                <CardHeader className="space-y-1 text-center pt-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Mail className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">Check Your Email</CardTitle>
                    <CardDescription className="text-slate-400">
                        We've sent a verification link to <span className="text-white font-medium">{user?.email}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 px-8 pb-6 text-center">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        To access your dashboard and start configuring H360 Health, please click the link in the email we just sent you. 
                        If you don't see it, check your spam folder.
                    </p>

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${
                            message.type === "success" 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                        <Button 
                            onClick={handleCheckStatus} 
                            className="h-11 font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]"
                        >
                            <CheckCircle className="mr-2 h-5 w-5" /> I've Verified My Email
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleResend} 
                            disabled={sending || cooldown > 0}
                            className="h-11 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                        >
                            {sending ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Link"}
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 text-center text-sm pb-8 px-8 border-t border-slate-800/50 pt-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Login
                    </button>
                    <div className="text-xs text-slate-500 font-medium pt-2">
                        © 2024 H360 Health. All rights reserved.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
