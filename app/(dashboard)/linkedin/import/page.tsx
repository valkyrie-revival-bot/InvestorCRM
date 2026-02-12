import { getLinkedInImportStats } from '@/app/actions/linkedin';
import { CSVUploader } from './_components/csv-uploader';

/**
 * LinkedIn Network Import Page
 * Server component that displays import stats and CSV upload form
 * Part of Phase 04.5 (Contact Intelligence)
 */
export default async function LinkedInImportPage() {
  // Fetch existing import stats
  const statsResult = await getLinkedInImportStats();
  const stats = statsResult.error ? [] : statsResult.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          LinkedIn Network Import
        </h1>
        <p className="text-muted-foreground">
          Import team LinkedIn connections to map warm introduction paths to
          investors
        </p>
      </div>

      {/* Import stats */}
      {stats && stats.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Import Status</h2>
          <div className="grid gap-3">
            {stats.map((stat) => (
              <div
                key={stat.team_member_name}
                className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-4 py-3"
              >
                <span className="font-medium">{stat.team_member_name}</span>
                <span className="text-sm text-muted-foreground">
                  {stat.count.toLocaleString()} contacts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV upload form */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Import CSV File</h2>
        <CSVUploader />
      </div>
    </div>
  );
}
