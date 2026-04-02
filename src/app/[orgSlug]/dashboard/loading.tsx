import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-white/70">
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
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <Card className="border-none shadow-sm bg-white/70 overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`${height} w-full rounded-xl`} />
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton height="h-[300px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

