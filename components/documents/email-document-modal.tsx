'use client';

/**
 * EmailDocumentModal component
 * Modal to send a document via email
 */

import { useState } from 'react';
import { Send, X } from 'lucide-react';
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
import { sendDocumentEmail } from '@/app/actions/documents';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { DriveLink } from '@/types/google';

interface EmailDocumentModalProps {
  driveLink: DriveLink;
  investorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDocumentModal({
  driveLink,
  investorId,
  open,
  onOpenChange,
}: EmailDocumentModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(`Document: ${driveLink.file_name}`);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim()) {
      toast.error('Please enter recipient email');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter email subject');
      return;
    }

    setIsSending(true);

    try {
      const result = await sendDocumentEmail({
        investorId,
        driveLinkId: driveLink.id,
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim() || '',
      });

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`Email sent to ${to}`);
        onOpenChange(false);
        // Reset form
        setTo('');
        setSubject(`Document: ${driveLink.file_name}`);
        setBody('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error sending document email:', error);
      toast.error('Failed to send email');
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Email Document</DialogTitle>
          <DialogDescription>
            Send "{driveLink.file_name}" via email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* To */}
          <div className="space-y-2">
            <Label htmlFor="to">
              To <span className="text-destructive">*</span>
            </Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSending}
              required
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              required
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Add a message for the recipient..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              rows={6}
            />
            <div className="text-xs text-muted-foreground">
              The document link will be automatically added to the email.
            </div>
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
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
