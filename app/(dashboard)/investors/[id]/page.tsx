/**
 * Investor detail page
 * Server component that fetches investor data and renders detail view
 * Next.js 16: params is a Promise that must be awaited
 */

import { getInvestor } from '@/app/actions/investors';
import { InvestorFormSections } from '@/components/investors/investor-form-sections';
import { ContactList } from '@/components/investors/contact-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

interface InvestorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestorDetailPage({
  params,
}: InvestorDetailPageProps) {
  // Next.js 16: params is a Promise, must await it
  const { id } = await params;

  // Fetch investor data
  const result = await getInvestor(id);

  // Handle not found
  if (result.error || !result.data) {
    notFound();
  }

  const investor = result.data;

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/investors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {investor.firm_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Investor Details
            </p>
          </div>
        </div>

        {/* Delete button - will be wired in Plan 05 */}
        <Button variant="destructive" size="sm" disabled>
          Delete
        </Button>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        <InvestorFormSections investor={investor} />

        {/* Contacts Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Contacts</h2>
          <ContactList
            contacts={investor.contacts}
            investorId={investor.id}
          />
        </div>
      </div>
    </div>
  );
}
