'use client';

/**
 * QuickAddActivityModal component
 * Dialog modal for quickly logging activities (call, email, meeting, note)
 * with optional next action setting
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, Mail, Calendar, FileText, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  activityCreateSchema,
  USER_ACTIVITY_TYPES,
  type ActivityCreateInput,
} from '@/lib/validations/activity-schema';
import { createActivity } from '@/app/actions/investors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface QuickAddActivityModalProps {
  investorId: string;
  currentNextAction?: string | null;
  currentNextActionDate?: string | null;
}

// Activity type configuration with icons
const activityTypeConfig = {
  note: { icon: FileText, label: 'Note' },
  call: { icon: Phone, label: 'Call' },
  email: { icon: Mail, label: 'Email' },
  meeting: { icon: Calendar, label: 'Meeting' },
} as const;

export function QuickAddActivityModal({
  investorId,
  currentNextAction,
  currentNextActionDate,
}: QuickAddActivityModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNextAction, setShowNextAction] = useState(false);
  const router = useRouter();

  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(activityCreateSchema),
    defaultValues: {
      investor_id: investorId,
      activity_type: 'note',
      description: '',
      set_next_action: false,
      next_action: currentNextAction || '',
      next_action_date: currentNextActionDate || '',
    },
  });

  const selectedType = form.watch('activity_type');

  const onSubmit = async (data: ActivityCreateInput) => {
    setIsSubmitting(true);
    try {
      const result = await createActivity(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Activity logged');
        form.reset({
          investor_id: investorId,
          activity_type: 'note',
          description: '',
          set_next_action: false,
          next_action: '',
          next_action_date: '',
        });
        setOpen(false);
        setShowNextAction(false);
        router.refresh();
      }
    } catch (error) {
      toast.error('Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Activity Type Toggle Buttons */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <div className="flex gap-2">
              {USER_ACTIVITY_TYPES.map((type) => {
                const config = activityTypeConfig[type];
                const Icon = config.icon;
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => form.setValue('activity_type', type)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
            {form.formState.errors.activity_type && (
              <p className="text-sm text-destructive">
                {form.formState.errors.activity_type.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What happened?"
              rows={3}
              autoFocus
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Set Next Action */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="set-next-action"
                checked={showNextAction}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  setShowNextAction(isChecked);
                  form.setValue('set_next_action', isChecked);
                }}
              />
              <Label
                htmlFor="set-next-action"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set next action
              </Label>
            </div>

            {showNextAction && (
              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="next-action">Next Action</Label>
                  <Input
                    id="next-action"
                    placeholder="What's the next step?"
                    {...form.register('next_action')}
                  />
                  {form.formState.errors.next_action && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.next_action.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next-action-date">Target Date</Label>
                  <Input
                    id="next-action-date"
                    type="date"
                    {...form.register('next_action_date')}
                  />
                  {form.formState.errors.next_action_date && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.next_action_date.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              'Log Activity'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
