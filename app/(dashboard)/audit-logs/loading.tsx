import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-5 w-[200px] mt-2" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b last:border-0">
            <Skeleton className="h-5 w-[120px]" />
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-5 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
