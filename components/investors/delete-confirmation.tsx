'use client';

/**
 * Delete confirmation component
 * Provides AlertDialog confirmation and undo toast functionality
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { softDeleteInvestor, restoreInvestor } from '@/app/actions/investors';

interface DeleteConfirmationProps {
  investorId: string;
  firmName: string;
}

export function DeleteConfirmation({
  investorId,
  firmName,
}: DeleteConfirmationProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await softDeleteInvestor(investorId);

    if (result.error) {
      toast.error('Failed to delete investor', {
        description: result.error,
      });
      setIsDeleting(false);
      return;
    }

    // Navigate to list page
    router.push('/investors');

    // Show undo toast with 10-second window
    toast.success(`"${firmName}" deleted`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          const restoreResult = await restoreInvestor(investorId);

          if (restoreResult.error) {
            toast.error('Failed to restore investor', {
              description: restoreResult.error,
            });
            return;
          }

          toast.success(`"${firmName}" restored`);
          router.push(`/investors/${investorId}`);
        },
      },
      duration: 10000, // 10 seconds
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {firmName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This investor record will be moved to trash. You can undo this action within 10 seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
