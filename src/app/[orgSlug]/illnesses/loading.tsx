import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function IllnessRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      <Skeleton className="h-4 flex-1 max-w-[220px]" />
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full ml-auto" />
    </div>
  );
}

export default function IllnessesLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-11 w-36 rounded-md" />
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-72 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Skeleton className="h-11 flex-1 max-w-md rounded-md" />
        <Skeleton className="h-4 w-24" />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex items-center gap-6">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20 ml-8" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <IllnessRowSkeleton key={i} />
        ))}
      </Card>
    </div>
  );
}

