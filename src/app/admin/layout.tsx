"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, loading, orgSlug } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/login");
            } else if (role === "platform_admin") {
                // Already in admin layout — no redirect needed, stay on current page
            } else if (role === "org_admin" && orgSlug) {
                router.push(`/${orgSlug}/dashboard`);
            } else {
                // For any other role or unrecognised role, redirect to login
                router.push("/auth/login");
            }
        }
    }, [user, role, orgSlug, loading, router]);

    if (loading || !user || role !== "platform_admin") {
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

    return (
        <div className="flex h-screen bg-background">
            <Sidebar type="admin" />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="container mx-auto py-10 px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
