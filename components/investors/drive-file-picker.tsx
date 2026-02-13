'use client';

/**
 * DriveFilePicker component
 * Google Picker integration for selecting Drive files to link to investors
 */

import { useState } from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { linkDriveFileToInvestor } from '@/app/actions/google/drive-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DriveFilePickerProps {
  investorId: string;
  disabled?: boolean;
}

export function DriveFilePicker({ investorId, disabled = false }: DriveFilePickerProps) {
  const [openPicker] = useDrivePicker();
  const [isLinking, setIsLinking] = useState(false);
  const router = useRouter();

  const handleOpenPicker = () => {
    if (disabled) return;

    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      viewId: 'DOCS', // Show all document types
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true, // Include shared drives
      multiselect: false,
      callbackFunction: async (data) => {
        if (data.action === 'picked' && data.docs && data.docs.length > 0) {
          const file = data.docs[0];
          setIsLinking(true);

          try {
            const result = await linkDriveFileToInvestor({
              investorId,
              fileId: file.id,
              fileName: file.name,
              fileUrl: file.url,
              mimeType: file.mimeType,
              thumbnailUrl: file.iconUrl || undefined,
            });

            if ('error' in result) {
              toast.error(`Failed to link document: ${result.error}`);
            } else {
              toast.success(`Linked: ${file.name}`);
              router.refresh();
            }
          } catch (error: any) {
            console.error('Error linking file:', error);
            toast.error('Failed to link document');
          } finally {
            setIsLinking(false);
          }
        }
      },
    });
  };

  if (disabled) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Connect Google account first"
      >
        <Paperclip className="h-4 w-4 mr-2" />
        Link Document
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenPicker}
      disabled={isLinking}
    >
      <Paperclip className="h-4 w-4 mr-2" />
      {isLinking ? 'Linking...' : 'Link Document'}
    </Button>
  );
}
