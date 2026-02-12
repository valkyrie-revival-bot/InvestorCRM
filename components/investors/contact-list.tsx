'use client';

/**
 * ContactList - Display and manage contacts for an investor
 * Simple add contact form inline (not modal) for Phase 3
 * Full contact editing will be enhanced in Phase 6 (Activity Management)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Phone, X } from 'lucide-react';
import { createContact } from '@/app/actions/contacts';
import type { Contact } from '@/types/investors';

interface ContactListProps {
  contacts: Contact[];
  investorId: string;
}

export function ContactList({ contacts: initialContacts, investorId }: ContactListProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const result = await createContact(investorId, {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        title: formData.title || null,
        notes: null,
        is_primary: false,
      });

      if (result.error || !result.data) {
        setError(result.error || 'Failed to create contact');
        setIsSaving(false);
        return;
      }

      // Success - add to local state and reset form
      setContacts([...contacts, result.data]);
      setFormData({ name: '', email: '', phone: '', title: '' });
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel adding
  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '', title: '' });
    setError(null);
    setIsAdding(false);
  };

  // Sort contacts: primary first
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Existing Contacts */}
      {sortedContacts.length > 0 ? (
        <div className="space-y-3">
          {sortedContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{contact.name}</span>
                  {contact.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
                {contact.title && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {contact.title}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          No contacts yet. Add a contact to get started.
        </p>
      )}

      {/* Add Contact Button or Form */}
      {!isAdding ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg border bg-accent/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Managing Partner"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSaving || !formData.name.trim()}>
              {isSaving ? 'Adding...' : 'Add Contact'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
