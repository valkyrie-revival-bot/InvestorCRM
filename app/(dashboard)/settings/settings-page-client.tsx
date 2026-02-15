'use client';

/**
 * Settings page client component
 * Manages user preferences and settings
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { UserPreferences, UserMessagingPreferences, Theme, Density, DefaultView, ItemsPerPage, EmailFrequency, TaskReminderSetting } from '@/types/preferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User as UserIcon, Bell, Monitor, Plug, Save } from 'lucide-react';

interface SettingsPageClientProps {
  user: User;
  initialPreferences: UserPreferences | null;
  initialMessagingPreferences: UserMessagingPreferences | null;
  googleConnected: boolean;
  whatsappConnected: boolean;
}

export function SettingsPageClient({
  user,
  initialPreferences,
  initialMessagingPreferences,
  googleConnected: initialGoogleConnected,
  whatsappConnected: initialWhatsappConnected,
}: SettingsPageClientProps) {
  const router = useRouter();

  // Profile state
  const [name, setName] = useState(user.user_metadata?.full_name || '');

  // UI preferences
  const [theme, setTheme] = useState<Theme>(initialPreferences?.theme || 'system');
  const [density, setDensity] = useState<Density>(initialPreferences?.density || 'comfortable');
  const [defaultView, setDefaultView] = useState<DefaultView>(initialPreferences?.default_view || 'list');
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(initialPreferences?.items_per_page || 25);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(initialPreferences?.email_notifications ?? true);
  const [emailFrequency, setEmailFrequency] = useState<EmailFrequency>(initialPreferences?.email_frequency || 'immediate');
  const [taskReminders, setTaskReminders] = useState<TaskReminderSetting>(initialPreferences?.task_reminders || '24h');
  const [overdueAlerts, setOverdueAlerts] = useState(initialPreferences?.overdue_alerts ?? true);

  // Messaging preferences
  const [notifyTaskReminders, setNotifyTaskReminders] = useState(initialMessagingPreferences?.notify_task_reminders ?? true);
  const [notifyInvestorUpdates, setNotifyInvestorUpdates] = useState(initialMessagingPreferences?.notify_investor_updates ?? true);
  const [notifyPipelineAlerts, setNotifyPipelineAlerts] = useState(initialMessagingPreferences?.notify_pipeline_alerts ?? true);
  const [notifyAiInsights, setNotifyAiInsights] = useState(initialMessagingPreferences?.notify_ai_insights ?? false);

  // Integration status
  const [googleConnected, setGoogleConnected] = useState(initialGoogleConnected);
  const [whatsappConnected, setWhatsappConnected] = useState(initialWhatsappConnected);

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const prefsChanged =
      theme !== (initialPreferences?.theme || 'system') ||
      density !== (initialPreferences?.density || 'comfortable') ||
      defaultView !== (initialPreferences?.default_view || 'list') ||
      itemsPerPage !== (initialPreferences?.items_per_page || 25) ||
      emailNotifications !== (initialPreferences?.email_notifications ?? true) ||
      emailFrequency !== (initialPreferences?.email_frequency || 'immediate') ||
      taskReminders !== (initialPreferences?.task_reminders || '24h') ||
      overdueAlerts !== (initialPreferences?.overdue_alerts ?? true);

    const messagingChanged =
      notifyTaskReminders !== (initialMessagingPreferences?.notify_task_reminders ?? true) ||
      notifyInvestorUpdates !== (initialMessagingPreferences?.notify_investor_updates ?? true) ||
      notifyPipelineAlerts !== (initialMessagingPreferences?.notify_pipeline_alerts ?? true) ||
      notifyAiInsights !== (initialMessagingPreferences?.notify_ai_insights ?? false);

    setHasChanges(prefsChanged || messagingChanged);
  }, [
    theme, density, defaultView, itemsPerPage,
    emailNotifications, emailFrequency, taskReminders, overdueAlerts,
    notifyTaskReminders, notifyInvestorUpdates, notifyPipelineAlerts, notifyAiInsights,
    initialPreferences, initialMessagingPreferences
  ]);

  // Apply theme immediately
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save user preferences
      const prefsResponse = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          density,
          default_view: defaultView,
          items_per_page: itemsPerPage,
          email_notifications: emailNotifications,
          email_frequency: emailFrequency,
          task_reminders: taskReminders,
          overdue_alerts: overdueAlerts,
        }),
      });

      if (!prefsResponse.ok) {
        throw new Error('Failed to save preferences');
      }

      // Save messaging preferences
      const messagingResponse = await fetch('/api/preferences/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notify_task_reminders: notifyTaskReminders,
          notify_investor_updates: notifyInvestorUpdates,
          notify_pipeline_alerts: notifyPipelineAlerts,
          notify_ai_insights: notifyAiInsights,
        }),
      });

      if (!messagingResponse.ok) {
        throw new Error('Failed to save messaging preferences');
      }

      toast.success('Settings saved successfully');
      setHasChanges(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleConnect = () => {
    window.location.href = '/api/google-oauth/authorize';
  };

  const handleWhatsappConnect = () => {
    toast.info('WhatsApp integration coming soon');
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferences and account settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ui">
            <Monitor className="h-4 w-4 mr-2" />
            UI Preferences
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure how and when you receive email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              {emailNotifications && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="email-frequency">Email Frequency</Label>
                    <Select value={emailFrequency} onValueChange={(v) => setEmailFrequency(v as EmailFrequency)}>
                      <SelectTrigger id="email-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="task-reminders">Task Reminders</Label>
                <Select value={taskReminders} onValueChange={(v) => setTaskReminders(v as TaskReminderSetting)}>
                  <SelectTrigger id="task-reminders">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 hours before</SelectItem>
                    <SelectItem value="1h">1 hour before</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overdue-alerts">Overdue Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about overdue tasks
                  </p>
                </div>
                <Switch
                  id="overdue-alerts"
                  checked={overdueAlerts}
                  onCheckedChange={setOverdueAlerts}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-tasks">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about upcoming and overdue tasks
                  </p>
                </div>
                <Switch
                  id="notify-tasks"
                  checked={notifyTaskReminders}
                  onCheckedChange={setNotifyTaskReminders}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-investors">Investor Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Changes to investor stages and key information
                  </p>
                </div>
                <Switch
                  id="notify-investors"
                  checked={notifyInvestorUpdates}
                  onCheckedChange={setNotifyInvestorUpdates}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-pipeline">Pipeline Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Stalled deals and pipeline health warnings
                  </p>
                </div>
                <Switch
                  id="notify-pipeline"
                  checked={notifyPipelineAlerts}
                  onCheckedChange={setNotifyPipelineAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-ai">AI Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    AI-generated recommendations and insights
                  </p>
                </div>
                <Switch
                  id="notify-ai"
                  checked={notifyAiInsights}
                  onCheckedChange={setNotifyAiInsights}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Preferences Tab */}
        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color theme
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="density">UI Density</Label>
                <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
                  <SelectTrigger id="density">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Control the spacing and padding of UI elements
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
              <CardDescription>
                Configure default view and pagination settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-view">Default View</Label>
                <Select value={defaultView} onValueChange={(v) => setDefaultView(v as DefaultView)}>
                  <SelectTrigger id="default-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your preferred view for investor pipeline
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="items-per-page">Items Per Page</Label>
                <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v) as ItemsPerPage)}>
                  <SelectTrigger id="items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Number of items to display per page in lists
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>
                Manage your connected integrations and services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Google Workspace</h4>
                    {googleConnected && (
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gmail, Calendar, Drive integration
                  </p>
                </div>
                <Button
                  variant={googleConnected ? 'outline' : 'default'}
                  onClick={handleGoogleConnect}
                >
                  {googleConnected ? 'Reconnect' : 'Connect'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">WhatsApp</h4>
                    {whatsappConnected && (
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp Business notifications
                  </p>
                </div>
                <Button
                  variant={whatsappConnected ? 'outline' : 'default'}
                  onClick={handleWhatsappConnect}
                >
                  {whatsappConnected ? 'Reconnect' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
