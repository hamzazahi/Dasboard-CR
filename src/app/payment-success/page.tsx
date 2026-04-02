"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const { orgId } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4 mt-20">
            <Card className="w-full max-w-md text-center border-slate-200 shadow-xl">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                    </div>
                    <CardTitle className="text-2xl text-emerald-600">Payment Successful! 🎉</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Your PayFast transaction has been completed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Your subscription is now activating. It may take a moment for the system to process the Instant Transaction Notification (ITN) from PayFast.
                    </p>
                    <Button 
                        className="w-full mt-6" 
                        onClick={() => {
                            if (orgId) {
                                router.push(`/${orgId}/subscription`);
                            } else {
                                router.push(`/dashboard`); // Fallback if context is lost
                            }
                        }}
                    >
                        Return to Subscription
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
