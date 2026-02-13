import { Skeleton } from "@/components/ui/skeleton";

export default function InvestorsLoading() {
  return (
    <div className="space-y-6">
      {/* Header with title and create button */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-[220px]" />
          <Skeleton className="h-5 w-[300px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>

      {/* View switcher tabs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-[200px] rounded-lg" />
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[130px]" />
        <Skeleton className="h-10 w-[130px]" />
      </div>

      {/* Summary bar */}
      <Skeleton className="h-5 w-[350px]" />

      {/* Table rows */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b">
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
        {/* Table body */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b last:border-0">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-6 w-[120px] rounded-full" />
            <Skeleton className="h-5 w-[80px]" />
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-5 w-[80px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
