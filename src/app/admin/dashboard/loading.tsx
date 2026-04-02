import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-0">
        <div className="p-6 flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-28 mt-1" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        </div>
        <div className="px-6 py-3 border-t flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function OrgRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-5 w-10 rounded-full" />
    </div>
  );
}

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-xl" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-52 mt-1" />
          </CardHeader>
          <CardContent className="px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <OrgRowSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-60 mt-1" />
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <OrgRowSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

