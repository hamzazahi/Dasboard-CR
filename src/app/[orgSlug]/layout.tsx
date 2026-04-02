"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgSlug: string }>;
}) {
    const { orgSlug } = use(params);
    const { user, role, loading, orgId, emailVerified } = useAuth();
    const router = useRouter();
    const [org, setOrg] = useState<any>(null);

    useEffect(() => {
        if (orgId) {
            const unsubscribe = onSnapshot(doc(db, "organizations", orgId), (docSnap) => {
                if (docSnap.exists()) {
                    setOrg(docSnap.data());
                }
            });
            return () => unsubscribe();
        }
    }, [orgId]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/login");
            } else if (role !== "org_admin") {
                if (role === "platform_admin") {
                    router.push("/admin/dashboard");
                } else {
                    router.push("/auth/login");
                }
            } else if (!emailVerified) {
                router.push("/auth/verify-email");
            }
        }
    }, [user, role, loading, emailVerified, router]);

    if (loading || !user || role !== "org_admin") {
        return (
            <div className="flex h-screen w-full items-center justify-center p-8 space-x-4">
                <Skeleton className="h-full w-64 rounded-xl" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-[calc(100%-80px)] w-full rounded-xl" />
                </div>
            </div>
        );
    }

    const isSuspended = org?.status === "suspended";
    const isSubscriptionPage = typeof window !== 'undefined' && window.location.pathname.endsWith('/subscription');

    if (isSuspended && !isSubscriptionPage) {
        return (
            <div className="flex flex-col h-screen bg-background items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Subscription Suspended</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Your organisation's access has been temporarily suspended due to a missed payment via PayFast.
                    </p>
                    <button
                        onClick={() => router.push(`/${orgSlug}/subscription`)}
                        className="mt-6 w-full inline-flex justify-center flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Go to Billing & Renew
                    </button>
                    <button
                        onClick={() => {
                            auth.signOut();
                            router.push('/auth/login');
                        }}
                        className="w-full mt-2 inline-flex justify-center flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar type="org" orgSlug={orgSlug} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="container mx-auto py-10 px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

