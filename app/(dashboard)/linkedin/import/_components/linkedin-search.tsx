'use client';

/**
 * LinkedIn Contact Search Component
 * Allows searching contacts by name or company across all team members
 */

import { useState, useCallback } from 'react';
import { Search, ExternalLink, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchLinkedInContacts, type LinkedInSearchResult } from '@/app/actions/linkedin';
import { useEffect, useRef } from 'react';

export function LinkedInSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LinkedInSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search — fires 350ms after user stops typing
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const result = await searchLinkedInContacts(value);
        setResults(result.data || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, []);

  // Group results by team member
  const grouped = results.reduce((acc, contact) => {
    const key = contact.team_member_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(contact);
    return acc;
  }, {} as Record<string, LinkedInSearchResult[]>);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isSearching ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
        <Input
          placeholder="Search contacts by name or company..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results */}
      {hasSearched && !isSearching && (
        <>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No contacts found for &quot;{query}&quot;
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {results.length} contact{results.length !== 1 ? 's' : ''} found for &quot;{query}&quot;
              </p>

              {Object.entries(grouped).map(([member, contacts]) => (
                <div key={member} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {member} ({contacts.length})
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2 hover:bg-card transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{contact.full_name}</p>
                          {(contact.company || contact.position) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[contact.position, contact.company].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        {contact.linkedin_url && (
                          <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
