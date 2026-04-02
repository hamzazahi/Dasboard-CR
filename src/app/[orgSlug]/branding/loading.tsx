import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function BrandingLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-56 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-6">
                  <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-9 w-40 rounded-md" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-64 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>

          <Skeleton className="h-11 w-full rounded-md" />
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-52 mt-1" />
            </CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="w-[320px] h-[560px] rounded-[3rem]" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

