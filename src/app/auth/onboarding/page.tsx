"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { startH360Payment } from "@/app/actions/payfast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ArrowRight } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    tier: string;
    priceMonthlyZAR: number;
    features: string[];
    description: string;
    maxIllnesses: number;
}

export default function OnboardingPage() {
    const [step, setStep] = useState<"plans" | "checkout">("plans");
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "plans"));
                const fetchedPlans: Plan[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedPlans.push({ id: doc.id, ...doc.data() } as Plan);
                });

                // Sort plans by price
                fetchedPlans.sort((a, b) => a.priceMonthlyZAR - b.priceMonthlyZAR);
                setPlans(fetchedPlans);
            } catch (err) {
                console.error("Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setStep("checkout");
    };

    const handleActivate = async () => {
        if (!auth.currentUser || !selectedPlan) return;
        setActivating(true);

        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error("User profile not found.");
            }

            const tempClinicName = userSnap.data().tempClinicName || "My Orgnization";

            // Generate a unique Org ID
            const orgId = `org_${auth.currentUser.uid.substring(0, 8)}_${Date.now()}`;

            // Create Organization Doc
            await setDoc(doc(db, "organizations", orgId), {
                orgName: tempClinicName,
                ownerUid: auth.currentUser.uid,
                status: "pending_payment",
                planTier: selectedPlan.tier,
                createdAt: new Date().toISOString(),
                // Set short expiry before payment is verified by webhook
                subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                allowedIllnesses: selectedPlan.tier === "full" ? ["all"] : ["tb", "hypertension", "diabetes"], // Default starter pack
                branding: {
                    appName: tempClinicName,
                    primaryColor: "#0F172A",
                    secondaryColor: "#334155",
                    logoUrl: "",
                    welcomeMessage: `Welcome to ${tempClinicName}`,
                    disclaimerText: "This is a screening tool. Please consult a doctor for a full diagnosis."
                },
                qrCode: `https://h360.app/org/${orgId}`,
                currency: "ZAR"
            });

            // Update User Doc with OrgId and remove temp field
            await setDoc(userRef, {
                orgId: orgId,
                tempClinicName: null // clear temporary field
            }, { merge: true });

            // Generate PayFast Payment Data
            // Use centralized action to generate PayFast Payment Data and Signature
            const result = await startH360Payment(
                orgId, 
                selectedPlan.tier, 
                selectedPlan.priceMonthlyZAR, 
                auth.currentUser?.email || undefined
            );

            if (result.success && result.paymentData) {
                const form = document.createElement('form');
                form.action = result.payfastUrl!;
                form.method = 'POST';

                for (const [key, value] of Object.entries(result.paymentData)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = String(value);
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
            } else {
                throw new Error("Failed to initialize payment");
            }

        } catch (err) {
            console.error("Activation Error:", err);
            setActivating(false);
        }
    };

    const handleStartTrial = async () => {
        if (!auth.currentUser || !selectedPlan) return;
        setActivating(true);

        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error("User profile not found.");
            }

            const tempClinicName = userSnap.data().tempClinicName || "My Orgnization";
            const orgId = `org_${auth.currentUser.uid.substring(0, 8)}_${Date.now()}`;

            // Create Organization Doc with 15-day trial
            await setDoc(doc(db, "organizations", orgId), {
                orgName: tempClinicName,
                ownerUid: auth.currentUser.uid,
                status: "active", // Active because it's a trial
                isTrial: true,
                planTier: selectedPlan.tier,
                createdAt: new Date().toISOString(),
                // 15 days from now
                subscriptionExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                allowedIllnesses: selectedPlan.tier === "full" ? ["all"] : ["tb", "hypertension", "diabetes"],
                branding: {
                    appName: tempClinicName,
                    primaryColor: "#0F172A",
                    secondaryColor: "#334155",
                    logoUrl: "",
                    welcomeMessage: `Welcome to ${tempClinicName}`,
                    disclaimerText: "This is a screening tool. Please consult a doctor for a full diagnosis."
                },
                qrCode: `https://h360.app/org/${orgId}`,
                currency: "ZAR"
            });

            // Update User Doc
            await setDoc(userRef, {
                orgId: orgId,
                tempClinicName: null
            }, { merge: true });

            // Derive slug for redirection
            const slug = tempClinicName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
            
            // Redirect to dashboard
            router.push(`/${slug}/dashboard`);

        } catch (err) {
            console.error("Trial Activation Error:", err);
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (step === "checkout" && selectedPlan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <Card className="w-full max-w-md shadow-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">Complete Activation</CardTitle>
                        <CardDescription>Review your selected plan to finish onboarding.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200">
                            <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                            <p className="text-3xl font-bold mt-2">
                                R{selectedPlan.priceMonthlyZAR} <span className="text-sm font-normal text-slate-500">/month</span>
                            </p>
                            <ul className="mt-4 space-y-2">
                                {selectedPlan.features.slice(0, 3).map((f, i) => (
                                    <li key={i} className="flex items-center text-sm text-slate-600">
                                        <Check className="h-4 w-4 mr-2 text-primary" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg text-sky-800 text-sm">
                            <strong>Note:</strong> You will be redirected to PayFast to securely complete your subscription payment.
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <div className="flex gap-4 w-full">
                            <Button variant="outline" onClick={() => setStep("plans")} disabled={activating}>
                                Back
                            </Button>
                            <Button onClick={handleActivate} className="flex-1" disabled={activating}>
                                {activating ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
                                ) : (
                                    "Pay via PayFast"
                                )}
                            </Button>
                        </div>
                        
                        <div className="relative w-full py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-950 px-2 text-slate-500">Or</span></div>
                        </div>

                        <Button 
                            variant="ghost" 
                            className="w-full text-primary font-bold hover:bg-primary/5 h-11 rounded-xl"
                            onClick={handleStartTrial}
                            disabled={activating}
                        >
                            {activating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Start 15-Day Free Trial"
                            )}
                        </Button>
                        <p className="text-[10px] text-center text-slate-400">No credit card required to start trial</p>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Step 1: Plans
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Select a Screening Package
                </h2>
                <p className="mt-4 max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto">
                    Choose the right plan to configure the depth and quantity of medical screenings your clinic provides.
                </p>
            </div>

            <div className="mt-16 max-w-7xl mx-auto grid gap-8 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col border-slate-200 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
                        {plan.tier === "medium" && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                RECOMMENDED
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold">R{plan.priceMonthlyZAR}</span>
                                <span className="text-slate-500 font-medium">/mo</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <Check className="h-5 w-5 text-green-500 shrink-0 mr-3" />
                                        <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.tier === "medium" ? "default" : "outline"}
                                onClick={() => handleSelectPlan(plan)}
                            >
                                Select {plan.name} <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
