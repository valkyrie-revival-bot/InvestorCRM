/**
 * Messaging Preferences Component
 * Allows users to configure Google Chat and WhatsApp notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Phone, Bell, Save, Loader2 } from 'lucide-react';
import {
  getUserMessagingPreferences,
  updateMessagingPreferences,
} from '@/app/actions/messaging';
import type { UserMessagingPreferences } from '@/types/messaging';

export function MessagingPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserMessagingPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoading(true);
    const result = await getUserMessagingPreferences();

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setPreferences(result.data);
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!preferences) return;

    setSaving(true);

    const result = await updateMessagingPreferences({
      google_chat_enabled: preferences.google_chat_enabled,
      google_chat_space_id: preferences.google_chat_space_id,
      whatsapp_enabled: preferences.whatsapp_enabled,
      whatsapp_phone_number: preferences.whatsapp_phone_number,
      notify_task_reminders: preferences.notify_task_reminders,
      notify_investor_updates: preferences.notify_investor_updates,
      notify_pipeline_alerts: preferences.notify_pipeline_alerts,
      notify_ai_insights: preferences.notify_ai_insights,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Preferences saved successfully');
      if (result.data) {
        setPreferences(result.data);
      }
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Failed to load messaging preferences
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Chat */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-primary" />
            <CardTitle>Google Chat</CardTitle>
          </div>
          <CardDescription>
            Receive notifications and interact with your CRM via Google Chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="google-chat-enabled">Enable Google Chat</Label>
              <p className="text-sm text-muted-foreground">
                Get notifications in Google Chat
              </p>
            </div>
            <Switch
              id="google-chat-enabled"
              checked={preferences.google_chat_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, google_chat_enabled: checked })
              }
            />
          </div>

          {preferences.google_chat_enabled && (
            <div className="space-y-2">
              <Label htmlFor="google-chat-space">Space ID</Label>
              <Input
                id="google-chat-space"
                placeholder="spaces/AAAAA... (leave empty for DM)"
                value={preferences.google_chat_space_id || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    google_chat_space_id: e.target.value || null,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to receive messages in a direct message. Or enter a space ID to
                receive in a specific room.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-brand-primary" />
            <CardTitle>WhatsApp</CardTitle>
          </div>
          <CardDescription>
            Receive notifications via WhatsApp (low volume, internal use)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-enabled">Enable WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Get notifications via WhatsApp
              </p>
            </div>
            <Switch
              id="whatsapp-enabled"
              checked={preferences.whatsapp_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, whatsapp_enabled: checked })
              }
            />
          </div>

          {preferences.whatsapp_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone">Phone Number</Label>
                <Input
                  id="whatsapp-phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={preferences.whatsapp_phone_number || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      whatsapp_phone_number: e.target.value || null,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Enter your phone number in international format (e.g., +1234567890)
                </p>
              </div>

              {preferences.whatsapp_verified ? (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                  ✓ Phone number verified
                </div>
              ) : (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  ⚠ Phone number not verified. Save your preferences, then contact support
                  to complete verification.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-primary" />
            <CardTitle>Notification Types</CardTitle>
          </div>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-tasks">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming and overdue tasks
              </p>
            </div>
            <Switch
              id="notify-tasks"
              checked={preferences.notify_task_reminders}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notify_task_reminders: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-investors">Investor Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when investors change stage or have new activity
              </p>
            </div>
            <Switch
              id="notify-investors"
              checked={preferences.notify_investor_updates}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notify_investor_updates: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-pipeline">Pipeline Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get alerts about stalled investors and pipeline issues
              </p>
            </div>
            <Switch
              id="notify-pipeline"
              checked={preferences.notify_pipeline_alerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notify_pipeline_alerts: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-ai">AI Insights</Label>
              <p className="text-sm text-muted-foreground">
                Receive proactive insights from the AI BDR agent
              </p>
            </div>
            <Switch
              id="notify-ai"
              checked={preferences.notify_ai_insights}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notify_ai_insights: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
