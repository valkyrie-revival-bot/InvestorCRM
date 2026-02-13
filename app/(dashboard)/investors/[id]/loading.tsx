import { Skeleton } from "@/components/ui/skeleton";

export default function InvestorDetailLoading() {
  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-9 w-[250px]" />
            <Skeleton className="h-4 w-[120px] mt-2" />
          </div>
        </div>
        <Skeleton className="h-9 w-[80px]" />
      </div>

      {/* Form sections */}
      <div className="space-y-6">
        {/* Section 1: Core Details */}
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-[140px] mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Strategy */}
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-[100px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Section 3: Contacts */}
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-[90px] mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[200px] mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Activity Timeline */}
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-[140px] mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-3 w-3 rounded-full mt-1 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[300px] mt-1" />
                  <Skeleton className="h-3 w-[100px] mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
