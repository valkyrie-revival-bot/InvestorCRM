'use client';

/**
 * LinkedDocuments component
 * Displays linked Google Drive files with metadata and unlink capability
 */

import { useState } from 'react';
import { FileText, FileSpreadsheet, Presentation, File, X, Mail, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { unlinkDriveFile } from '@/app/actions/google/drive-actions';
import { DriveLink } from '@/types/google';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SignatureRequestModal } from '@/components/documents/signature-request-modal';
import { EmailDocumentModal } from '@/components/documents/email-document-modal';

interface LinkedDocumentsProps {
  links: DriveLink[];
  investorId: string;
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get appropriate icon for file type based on MIME type
 */
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;

  if (mimeType.includes('document') || mimeType.includes('text')) {
    return FileText;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return FileSpreadsheet;
  }
  if (mimeType.includes('presentation') || mimeType.includes('slides')) {
    return Presentation;
  }

  return File;
}

export function LinkedDocuments({ links, investorId }: LinkedDocumentsProps) {
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<DriveLink | null>(null);
  const router = useRouter();

  const handleUnlink = async (linkId: string, fileName: string) => {
    if (!confirm(`Unlink "${fileName}"?`)) {
      return;
    }

    setUnlinkingId(linkId);

    try {
      const result = await unlinkDriveFile({
        linkId,
        investorId,
        fileName,
      });

      if ('error' in result) {
        toast.error(`Failed to unlink: ${result.error}`);
      } else {
        toast.success(`Unlinked: ${fileName}`);
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error unlinking file:', error);
      toast.error('Failed to unlink document');
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleRequestSignature = (link: DriveLink) => {
    setSelectedLink(link);
    setSignatureModalOpen(true);
  };

  const handleEmailDocument = (link: DriveLink) => {
    setSelectedLink(link);
    setEmailModalOpen(true);
  };

  if (links.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No documents linked yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {links.map((link) => {
          const Icon = getFileIcon(link.mime_type);
          const isUnlinking = unlinkingId === link.id;

          return (
            <div
              key={link.id}
              className="flex items-center gap-3 rounded-lg border bg-card/50 p-3 group hover:bg-card transition-colors"
            >
              {/* File icon */}
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <a
                  href={link.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {link.file_name}
                </a>
                <div className="text-xs text-muted-foreground">
                  Linked {formatRelativeTime(link.created_at)}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRequestSignature(link)}
                  title="Request Signature"
                >
                  <PenLine className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmailDocument(link)}
                  title="Email Document"
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink(link.id, link.file_name)}
                  disabled={isUnlinking}
                  title="Unlink Document"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedLink && (
        <>
          <SignatureRequestModal
            driveLink={selectedLink}
            investorId={investorId}
            open={signatureModalOpen}
            onOpenChange={setSignatureModalOpen}
          />
          <EmailDocumentModal
            driveLink={selectedLink}
            investorId={investorId}
            open={emailModalOpen}
            onOpenChange={setEmailModalOpen}
          />
        </>
      )}
    </>
  );
}
