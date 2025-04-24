import { Skeleton } from "@/components/ui/skeleton";

export function ActivitySkeletonItem() {
  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </li>
  );
}

export function ActivitySkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <ActivitySkeletonItem key={i} />
        ))}
    </ul>
  );
}