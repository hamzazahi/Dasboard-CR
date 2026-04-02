"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootPage() {
  const { user, role, orgSlug, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (role === "platform_admin") {
        router.push("/admin/dashboard");
      } else if (role === "org_admin" && orgSlug) {
        router.push(`/${orgSlug}/dashboard`);
      } else {
        router.push("/auth/login");
      }
    }
  }, [user, role, orgSlug, loading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center p-12">
      <div className="w-full max-w-4xl space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
