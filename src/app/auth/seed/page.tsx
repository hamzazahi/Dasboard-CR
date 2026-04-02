"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SeedAdminPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            let user;
            try {
                // 1. Try to create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
            } catch (authError: any) {
                if (authError.code === "auth/email-already-in-use") {
                    console.log("User already exists in Auth, attempting to sign in...");
                    // Try to sign in instead
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    user = userCredential.user;
                } else {
                    throw authError;
                }
            }

            // Small delay to ensure auth state is perceived by Firestore rules
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 2. Create profile in Firestore with platform_admin role
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: "platform_admin",
                name: "Platform Administrator",
                createdAt: new Date().toISOString()
            });

            setStatus("success");
            setMessage(`Success! Platform Admin account ${email} is ready. You can now go to the login page.`);
        } catch (error: any) {
            console.error("Seeding Error:", error);
            setStatus("error");
            setMessage(error.message || "An error occurred during seeding.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md border-orange-200 dark:border-orange-900 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="text-orange-500" />
                        Initial Admin Seeding
                    </CardTitle>
                    <CardDescription>
                        Use this temporary tool to create your first **Platform Admin** account.
                        Delete this file after use.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === "success" ? (
                        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                            <Button className="w-full mt-4" onClick={() => window.location.href = "/auth/login"}>
                                Go to Login
                            </Button>
                        </Alert>
                    ) : (
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@h360.app"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {status === "error" && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full" disabled={status === "loading"}>
                                {status === "loading" ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Admin...
                                    </>
                                ) : (
                                    "Create Platform Admin"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
