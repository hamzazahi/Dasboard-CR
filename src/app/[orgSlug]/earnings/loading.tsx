import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-950">
      <CardContent className="p-0">
        <div className="p-6 flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-28 mt-1" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        </div>
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function EarningsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-52 mt-1" />
          </CardHeader>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </CardHeader>
        <div className="p-0">
          <div className="grid grid-cols-5 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800">
            {["w-16", "w-24", "w-28", "w-24", "w-28"].map((w, i) => (
              <Skeleton key={i} className={`h-3 ${w}`} />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20 font-mono" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

