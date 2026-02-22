import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/components/OnboardingWizard';
import { 
  User, Bell, Palette, Shield, Monitor, Moon, Sun, 
  Mail, Save, RotateCcw, DollarSign, AlertTriangle, TrendingUp, Rocket
} from 'lucide-react';

interface NotificationPreferences {
  emailAlerts: boolean;
  budgetExceeded: boolean;
  budgetWarning: boolean;
  anomalyDetected: boolean;
  weeklyDigest: boolean;
  warningThreshold: number;
  criticalThreshold: number;
}

interface DisplayPreferences {
  currency: string;
  dateFormat: string;
  compactNumbers: boolean;
  showTrends: boolean;
  defaultDays: number;
}

const STORAGE_KEYS = {
  notifications: 'spendlens-notification-prefs',
  display: 'spendlens-display-prefs',
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const { resetOnboarding } = useOnboarding();
  const [mounted, setMounted] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.notifications);
    return saved ? JSON.parse(saved) : {
      emailAlerts: true,
      budgetExceeded: true,
      budgetWarning: true,
      anomalyDetected: true,
      weeklyDigest: false,
      warningThreshold: 80,
      criticalThreshold: 100,
    };
  });

  // Display preferences
  const [display, setDisplay] = useState<DisplayPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.display);
    return saved ? JSON.parse(saved) : {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      compactNumbers: true,
      showTrends: true,
      defaultDays: 30,
    };
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveNotifications = () => {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    toast({
      title: 'Notification preferences saved',
      description: 'Your notification settings have been updated.',
    });
  };

  const handleSaveDisplay = () => {
    localStorage.setItem(STORAGE_KEYS.display, JSON.stringify(display));
    toast({
      title: 'Display preferences saved',
      description: 'Your display settings have been updated.',
    });
  };

  const handleResetNotifications = () => {
    const defaults: NotificationPreferences = {
      emailAlerts: true,
      budgetExceeded: true,
      budgetWarning: true,
      anomalyDetected: true,
      weeklyDigest: false,
      warningThreshold: 80,
      criticalThreshold: 100,
    };
    setNotifications(defaults);
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(defaults));
    toast({
      title: 'Settings reset',
      description: 'Notification preferences have been reset to defaults.',
    });
  };

  const handleResetDisplay = () => {
    const defaults: DisplayPreferences = {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      compactNumbers: true,
      showTrends: true,
      defaultDays: 30,
    };
    setDisplay(defaults);
    localStorage.setItem(STORAGE_KEYS.display, JSON.stringify(defaults));
    toast({
      title: 'Settings reset',
      description: 'Display preferences have been reset to defaults.',
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and notification settings
        </p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Display
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Customize how SpendLens looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">Color Theme</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                      <Sun className="h-6 w-6 text-warning" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Light</div>
                      <div className="text-xs text-muted-foreground">Bright and clean</div>
                    </div>
                    {theme === 'light' && (
                      <Badge variant="default" className="mt-1">Active</Badge>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Moon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Dark</div>
                      <div className="text-xs text-muted-foreground">Easy on the eyes</div>
                    </div>
                    {theme === 'dark' && (
                      <Badge variant="default" className="mt-1">Active</Badge>
                    )}
                  </button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Use System Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically match your device's appearance settings
                  </p>
                </div>
                <Switch
                  checked={theme === 'system'}
                  onCheckedChange={(checked) => setTheme(checked ? 'system' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-lg">{user?.email || 'Not signed in'}</div>
                  <div className="text-sm text-muted-foreground">Account email</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Setup Wizard
              </CardTitle>
              <CardDescription>
                Re-run the initial setup wizard to update your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetOnboarding();
                  toast({
                    title: 'Onboarding reset',
                    description: 'Reload the dashboard to see the setup wizard.',
                  });
                }}
                className="gap-2"
              >
                <Rocket className="h-4 w-4" />
                Restart Setup Wizard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure which alerts you want to receive via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about important events
                  </p>
                </div>
                <Switch
                  checked={notifications.emailAlerts}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, emailAlerts: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Alert Types</Label>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <div className="font-medium">Budget Exceeded</div>
                      <div className="text-xs text-muted-foreground">When spending exceeds threshold</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.budgetExceeded}
                    disabled={!notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, budgetExceeded: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <div className="font-medium">Budget Warning</div>
                      <div className="text-xs text-muted-foreground">When approaching threshold</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.budgetWarning}
                    disabled={!notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, budgetWarning: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-info/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <div className="font-medium">Anomaly Detected</div>
                      <div className="text-xs text-muted-foreground">When unusual spending is detected</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.anomalyDetected}
                    disabled={!notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, anomalyDetected: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Weekly Digest</div>
                      <div className="text-xs text-muted-foreground">Weekly summary of spending</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    disabled={!notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, weeklyDigest: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Alert Thresholds
              </CardTitle>
              <CardDescription>
                Set the percentage thresholds for budget alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warning">Warning Threshold (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="warning"
                      type="number"
                      min={50}
                      max={99}
                      value={notifications.warningThreshold}
                      onChange={(e) => 
                        setNotifications({ 
                          ...notifications, 
                          warningThreshold: parseInt(e.target.value) || 80 
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">of budget</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alert when spending reaches this percentage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical">Critical Threshold (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="critical"
                      type="number"
                      min={100}
                      max={200}
                      value={notifications.criticalThreshold}
                      onChange={(e) => 
                        setNotifications({ 
                          ...notifications, 
                          criticalThreshold: parseInt(e.target.value) || 100 
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">of budget</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Critical alert when spending exceeds this
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button onClick={handleSaveNotifications}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleResetNotifications}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Display Preferences
              </CardTitle>
              <CardDescription>
                Customize how data is displayed in the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={display.currency}
                    onValueChange={(value) => setDisplay({ ...display, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={display.dateFormat}
                    onValueChange={(value) => setDisplay({ ...display, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultDays">Default Time Range</Label>
                  <Select
                    value={display.defaultDays.toString()}
                    onValueChange={(value) => setDisplay({ ...display, defaultDays: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compact Numbers</Label>
                    <p className="text-sm text-muted-foreground">
                      Display large numbers as 10K, 1.5M, etc.
                    </p>
                  </div>
                  <Switch
                    checked={display.compactNumbers}
                    onCheckedChange={(checked) => 
                      setDisplay({ ...display, compactNumbers: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Trend Indicators</Label>
                    <p className="text-sm text-muted-foreground">
                      Display arrows and percentages for cost changes
                    </p>
                  </div>
                  <Switch
                    checked={display.showTrends}
                    onCheckedChange={(checked) => 
                      setDisplay({ ...display, showTrends: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button onClick={handleSaveDisplay}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleResetDisplay}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
