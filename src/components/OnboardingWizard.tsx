import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Rocket, DollarSign, Bell, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Target, TrendingDown, Mail, AlertTriangle
} from 'lucide-react';

interface OnboardingData {
  monthlyBudget: string;
  warningThreshold: number;
  dailyAlerts: boolean;
  weeklyDigest: boolean;
  anomalyAlerts: boolean;
  budgetExceededAlerts: boolean;
  primaryGoal: string;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'spendlens-onboarding-complete';

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    monthlyBudget: '',
    warningThreshold: 80,
    dailyAlerts: false,
    weeklyDigest: true,
    anomalyAlerts: true,
    budgetExceededAlerts: true,
    primaryGoal: 'reduce-costs',
  });

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save preferences to localStorage
    localStorage.setItem('spendlens-notification-prefs', JSON.stringify({
      emailAlerts: true,
      budgetExceeded: data.budgetExceededAlerts,
      budgetWarning: true,
      anomalyDetected: data.anomalyAlerts,
      weeklyDigest: data.weeklyDigest,
      warningThreshold: data.warningThreshold,
      criticalThreshold: 100,
    }));

    if (data.monthlyBudget) {
      localStorage.setItem('spendlens-initial-budget', data.monthlyBudget);
    }

    localStorage.setItem('spendlens-primary-goal', data.primaryGoal);
    localStorage.setItem(STORAGE_KEY, 'true');

    toast({
      title: 'Welcome to SpendLens! 🎉',
      description: 'Your preferences have been saved. Let\'s start optimizing!',
    });

    onComplete();
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <GoalsStep data={data} setData={setData} />;
      case 2:
        return <BudgetStep data={data} setData={setData} />;
      case 3:
        return <NotificationsStep data={data} setData={setData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <CardContent className="p-0">
          {/* Progress Header */}
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">SpendLens Setup</h2>
                  <p className="text-sm text-muted-foreground">Step {step + 1} of {totalSteps}</p>
                </div>
              </div>
              <Badge variant="secondary">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="p-8 min-h-[400px]">
            {renderStep()}
          </div>

          {/* Navigation Footer */}
          <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < totalSteps - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="gap-2 bg-success hover:bg-success/90">
                <CheckCircle2 className="h-4 w-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto">
        <Rocket className="h-10 w-10 text-primary" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome to SpendLens!</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Let's set up your account in just a few steps to help you monitor and optimize your cloud spending.
        </p>
      </div>

      <div className="grid gap-4 max-w-md mx-auto pt-4">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 text-left">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">Set Your Goals</div>
            <div className="text-sm text-muted-foreground">Define what success looks like for you</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 text-left">
          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-success" />
          </div>
          <div>
            <div className="font-medium">Configure Budgets</div>
            <div className="text-sm text-muted-foreground">Set spending limits and thresholds</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 text-left">
          <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-info" />
          </div>
          <div>
            <div className="font-medium">Setup Notifications</div>
            <div className="text-sm text-muted-foreground">Stay informed about important events</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

function GoalsStep({ data, setData }: StepProps) {
  const goals = [
    { 
      id: 'reduce-costs', 
      title: 'Reduce Cloud Costs', 
      description: 'Identify waste and optimize spending',
      icon: TrendingDown,
      color: 'text-success'
    },
    { 
      id: 'prevent-overruns', 
      title: 'Prevent Budget Overruns', 
      description: 'Set alerts before exceeding limits',
      icon: AlertTriangle,
      color: 'text-warning'
    },
    { 
      id: 'visibility', 
      title: 'Improve Visibility', 
      description: 'Understand where money is going',
      icon: Target,
      color: 'text-primary'
    },
    { 
      id: 'planning', 
      title: 'Better Planning', 
      description: 'Forecast and model future costs',
      icon: Sparkles,
      color: 'text-info'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mx-auto">
          <Target className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">What's your primary goal?</h2>
        <p className="text-muted-foreground">
          This helps us customize your experience
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => setData({ ...data, primaryGoal: goal.id })}
            className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all ${
              data.primaryGoal === goal.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0`}>
              <goal.icon className={`h-5 w-5 ${goal.color}`} />
            </div>
            <div>
              <div className="font-medium">{goal.title}</div>
              <div className="text-sm text-muted-foreground">{goal.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BudgetStep({ data, setData }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/10 mx-auto">
          <DollarSign className="h-7 w-7 text-success" />
        </div>
        <h2 className="text-2xl font-bold">Set your budget</h2>
        <p className="text-muted-foreground">
          Define your monthly cloud spending limit
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        <div className="space-y-3">
          <Label htmlFor="budget" className="text-base">Monthly Budget</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="budget"
              type="number"
              placeholder="e.g., 50000"
              value={data.monthlyBudget}
              onChange={(e) => setData({ ...data, monthlyBudget: e.target.value })}
              className="pl-10 text-lg h-12"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Leave empty to skip for now. You can always set this later.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="threshold" className="text-base">Warning Threshold</Label>
          <Select
            value={data.warningThreshold.toString()}
            onValueChange={(value) => setData({ ...data, warningThreshold: parseInt(value) })}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="70">70% of budget</SelectItem>
              <SelectItem value="75">75% of budget</SelectItem>
              <SelectItem value="80">80% of budget (recommended)</SelectItem>
              <SelectItem value="85">85% of budget</SelectItem>
              <SelectItem value="90">90% of budget</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Get warned when spending reaches this percentage
          </p>
        </div>

        {data.monthlyBudget && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="text-sm font-medium">Preview</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Warning at:</span>
              <span className="font-medium text-warning">
                ${(parseFloat(data.monthlyBudget) * (data.warningThreshold / 100)).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Critical at:</span>
              <span className="font-medium text-destructive">
                ${parseFloat(data.monthlyBudget).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsStep({ data, setData }: StepProps) {
  const notifications = [
    {
      id: 'budgetExceededAlerts',
      title: 'Budget Exceeded',
      description: 'Alert when spending exceeds your budget',
      icon: AlertTriangle,
      color: 'bg-destructive/10 text-destructive',
      checked: data.budgetExceededAlerts,
    },
    {
      id: 'anomalyAlerts',
      title: 'Anomaly Detection',
      description: 'Alert when unusual spending patterns are detected',
      icon: Sparkles,
      color: 'bg-warning/10 text-warning',
      checked: data.anomalyAlerts,
    },
    {
      id: 'weeklyDigest',
      title: 'Weekly Digest',
      description: 'Receive a weekly summary of your cloud costs',
      icon: Mail,
      color: 'bg-primary/10 text-primary',
      checked: data.weeklyDigest,
    },
    {
      id: 'dailyAlerts',
      title: 'Daily Spending Alerts',
      description: 'Get daily updates on your spending',
      icon: Bell,
      color: 'bg-info/10 text-info',
      checked: data.dailyAlerts,
    },
  ];

  const toggleNotification = (id: keyof OnboardingData) => {
    setData({ ...data, [id]: !data[id] });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-info/10 mx-auto">
          <Bell className="h-7 w-7 text-info" />
        </div>
        <h2 className="text-2xl font-bold">Notification preferences</h2>
        <p className="text-muted-foreground">
          Choose how you want to stay informed
        </p>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full ${notification.color} flex items-center justify-center shrink-0`}>
                <notification.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.description}</div>
              </div>
            </div>
            <Switch
              checked={notification.checked}
              onCheckedChange={() => toggleNotification(notification.id as keyof OnboardingData)}
            />
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4">
        You can change these settings anytime from the Settings page
      </div>
    </div>
  );
}

export function useOnboarding() {
  const isComplete = localStorage.getItem(STORAGE_KEY) === 'true';
  
  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { isComplete, resetOnboarding };
}
