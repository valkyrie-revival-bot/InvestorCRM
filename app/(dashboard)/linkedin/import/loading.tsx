import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LinkedInImportLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-[280px]" />
        <Skeleton className="h-5 w-[350px] mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
