"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function RegisterPage() {
    const [clinicName, setClinicName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        if (password.length < 6) {
            return setError("Password must be at least 6 characters");
        }

        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create User Profile in Firestore with org_admin role
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: "org_admin",
                createdAt: new Date().toISOString(),
                tempClinicName: clinicName
            });

            // 3. Send Verification Email
            await sendEmailVerification(user);

            // 4. Move to Verification Info
            router.push("/auth/verify-email");

        } catch (err: any) {
            console.error("Registration Error:", err);
            if (err.code === "auth/email-already-in-use") {
                setError("An account with this email already exists.");
            } else {
                setError(err.message || "Failed to create an account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] p-4 relative overflow-hidden">
            {/* Ambient Background Effect */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#4da63f]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#4da63f]/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg relative z-10 shadow-2xl border-[#333333] bg-[#262626] text-white overflow-hidden rounded-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                
                <CardHeader className="space-y-1 text-center pt-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-40 h-16 transition-transform hover:scale-105 duration-300">
                            <Image 
                                src="/logo.png" 
                                alt="H360 Health Logo" 
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 33vw"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">Register Your Organization</CardTitle>
                    <CardDescription className="text-slate-400">
                        Create an account to start configuring your portal
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-8 pb-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clinicName" className="text-slate-300 font-medium ml-1">Organization Name</Label>
                                <Input
                                    id="clinicName"
                                    type="text"
                                    placeholder="e.g. HealthPlus Clinic"
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 h-10 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300 font-medium ml-1">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 h-10 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300 font-medium ml-1">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="bg-slate-900/50 border-slate-700 text-white h-10 rounded-xl focus:ring-primary/20 focus:border-primary transition-all pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-300 font-medium ml-1">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="bg-slate-900/50 border-slate-700 text-white h-10 rounded-xl focus:ring-primary/20 focus:border-primary transition-all pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11 font-bold text-lg rounded-lg shadow-lg shadow-[#4da63f]/10 bg-[#4da63f] hover:bg-[#439c38] transition-all hover:translate-y-[-1px] active:scale-[0.98] mt-2" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Continue to Packages"
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 text-center text-sm pb-8 px-8 border-t border-slate-800/50 pt-6 mt-2">
                    <p className="text-slate-400">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => router.push("/auth/login")}
                            className="font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                            Sign in
                        </button>
                    </p>
                    <div className="text-xs text-slate-500 font-medium">
                        © 2024 H360 Health. All rights reserved.
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
