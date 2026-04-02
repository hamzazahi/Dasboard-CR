"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function PaymentCancelPage() {
    const router = useRouter();
    const { orgId } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4 mt-20">
            <Card className="w-full max-w-md text-center border-slate-200 shadow-xl">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-16 w-16 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl text-amber-600">Payment Cancelled</CardTitle>
                    <CardDescription className="text-base mt-2">
                        You have cancelled the PayFast transaction.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-500">
                        No charges were made to your account, and your subscription status has not changed.
                    </p>
                    <Button 
                        variant="outline"
                        className="w-full mt-6" 
                        onClick={() => {
                            if (orgId) {
                                router.push(`/${orgId}/subscription`);
                            } else {
                                router.push(`/dashboard`); // Fallback
                            }
                        }}
                    >
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
