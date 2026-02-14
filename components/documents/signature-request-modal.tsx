'use client';

/**
 * SignatureRequestModal component
 * Modal to request a signature for a document
 */

import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createSignatureRequest } from '@/app/actions/documents';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { DriveLink } from '@/types/google';

interface SignatureRequestModalProps {
  driveLink: DriveLink;
  investorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignatureRequestModal({
  driveLink,
  investorId,
  open,
  onOpenChange,
}: SignatureRequestModalProps) {
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signerEmail.trim()) {
      toast.error('Please enter signer email');
      return;
    }

    setIsSending(true);

    try {
      const result = await createSignatureRequest({
        investorId,
        driveLinkId: driveLink.id,
        signerEmail: signerEmail.trim(),
        signerName: signerName.trim() || undefined,
        message: message.trim() || undefined,
      });

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`Signature request sent to ${signerEmail}`);
        onOpenChange(false);
        // Reset form
        setSignerEmail('');
        setSignerName('');
        setMessage('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error sending signature request:', error);
      toast.error('Failed to send signature request');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Signature</DialogTitle>
          <DialogDescription>
            Send a signature request for "{driveLink.file_name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Signer Email */}
          <div className="space-y-2">
            <Label htmlFor="signer-email">
              Signer Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signer-email"
              type="email"
              placeholder="signer@example.com"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              disabled={isSending}
              required
            />
          </div>

          {/* Signer Name */}
          <div className="space-y-2">
            <Label htmlFor="signer-name">Signer Name (optional)</Label>
            <Input
              id="signer-name"
              type="text"
              placeholder="John Doe"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message for the signer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={4}
            />
          </div>

          {/* Document Info */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="text-sm text-muted-foreground">Document</div>
            <div className="text-sm font-medium truncate">
              {driveLink.file_name}
            </div>
            <a
              href={driveLink.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View in Google Drive
            </a>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
