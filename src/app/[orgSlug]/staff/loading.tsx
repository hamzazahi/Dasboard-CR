import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

export default function StaffLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-12 mt-1" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Skeleton className="h-10 w-72 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex items-center gap-4">
            <Skeleton className="h-3 w-9" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32 ml-auto md:ml-0" />
            <Skeleton className="h-3 w-20 hidden md:block ml-auto" />
            <Skeleton className="h-3 w-16 hidden md:block" />
            <Skeleton className="h-3 w-8" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

