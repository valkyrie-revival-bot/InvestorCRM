'use client';

/**
 * MeetingScheduler component
 * Schedule Google Calendar meetings linked to investor records
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { scheduleInvestorMeeting } from '@/app/actions/google/calendar-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const meetingScheduleSchema = z
  .object({
    summary: z
      .string()
      .min(3, 'Summary must be at least 3 characters')
      .max(200, 'Summary must be at most 200 characters'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endDate: z.string().min(1, 'End date is required'),
    endTime: z.string().min(1, 'End time is required'),
    attendeeEmails: z.string().optional(),
  })
  .refine(
    (data) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
      return endDateTime > startDateTime;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

type MeetingScheduleFormData = z.infer<typeof meetingScheduleSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

interface MeetingSchedulerProps {
  investorId: string;
  investorName: string;
  disabled?: boolean;
}

export function MeetingScheduler({
  investorId,
  investorName,
  disabled = false,
}: MeetingSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const router = useRouter();

  const form = useForm<MeetingScheduleFormData>({
    resolver: zodResolver(meetingScheduleSchema),
    defaultValues: {
      summary: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      attendeeEmails: '',
    },
  });

  // Pre-fill form when dialog opens
  const handleDialogOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Pre-fill summary with investor name
      form.setValue('summary', `Meeting with ${investorName}`);

      // Default to tomorrow at 10am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      form.setValue('startDate', dateString);
      form.setValue('startTime', '10:00');
      form.setValue('endDate', dateString);
      form.setValue('endTime', '11:00'); // 1 hour default
    }
  };

  // Update end time when start time changes (default to 1 hour after)
  const handleStartTimeChange = (startDate: string, startTime: string) => {
    if (startDate && startTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour

      const endDateString = endDateTime.toISOString().split('T')[0];
      const endTimeString = endDateTime.toTimeString().substring(0, 5);

      form.setValue('endDate', endDateString);
      form.setValue('endTime', endTimeString);
    }
  };

  const onSubmit = async (data: MeetingScheduleFormData) => {
    setIsSubmitting(true);
    setAuthRequired(false);

    try {
      // Parse attendee emails (comma-separated)
      const attendees = data.attendeeEmails
        ?.split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      // Combine date + time into ISO 8601 datetime strings
      const startDateTime = `${data.startDate}T${data.startTime}:00`;
      const endDateTime = `${data.endDate}T${data.endTime}:00`;

      const result = await scheduleInvestorMeeting({
        investorId,
        summary: data.summary,
        description: data.description,
        startTime: startDateTime,
        endTime: endDateTime,
        attendees: attendees && attendees.length > 0 ? attendees : undefined,
      });

      if (result.error === 'google_auth_required') {
        setAuthRequired(true);
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Meeting scheduled!', {
          description: result.eventUrl ? (
            <a
              href={result.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View in Google Calendar
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : undefined,
        });
        form.reset();
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error('Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerButton = (
    <Button variant="outline" size="sm" disabled={disabled}>
      <Calendar className="h-4 w-4 mr-2" />
      Schedule Meeting
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {disabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
              <TooltipContent>
                <p>Google account not connected</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          triggerButton
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>

        {/* Auth Required Message */}
        {authRequired && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                Google account not connected
              </p>
              <p className="text-xs text-muted-foreground">
                Connect your Google account to schedule meetings
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = '/settings';
                }}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Connect Google Account
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Meeting Title *</Label>
            <Input
              id="summary"
              placeholder="e.g., Quarterly Review"
              {...form.register('summary')}
              autoFocus
            />
            {form.formState.errors.summary && (
              <p className="text-sm text-destructive">
                {form.formState.errors.summary.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Agenda, notes, or meeting details"
              rows={3}
              {...form.register('description')}
            />
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                {...form.register('startDate', {
                  onChange: (e) => {
                    const startDate = e.target.value;
                    const startTime = form.getValues('startTime');
                    handleStartTimeChange(startDate, startTime);
                  },
                })}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Input
                id="start-time"
                type="time"
                {...form.register('startTime', {
                  onChange: (e) => {
                    const startDate = form.getValues('startDate');
                    const startTime = e.target.value;
                    handleStartTimeChange(startDate, startTime);
                  },
                })}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                {...form.register('endDate')}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time *</Label>
              <Input
                id="end-time"
                type="time"
                {...form.register('endTime')}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees (optional)</Label>
            <Input
              id="attendees"
              type="text"
              placeholder="email1@example.com, email2@example.com"
              {...form.register('attendeeEmails')}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated email addresses
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
