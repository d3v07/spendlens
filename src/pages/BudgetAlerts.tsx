import { useState, useMemo } from 'react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle2, Filter, X, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertHistory, generateDemoHistory } from '@/components/AlertHistory';
import { useBudgetNotifications } from '@/hooks/useBudgetNotifications';
import { useAuth } from '@/hooks/useAuth';

const SERVICES = ['EC2', 'S3', 'RDS', 'Lambda', 'CloudWatch', 'CloudFront', 'DynamoDB', 'EBS', 'EKS', 'ElastiCache', 'Route53', 'API Gateway'];
const TEAMS = ['Engineering', 'Data', 'Platform', 'DevOps', 'ML'];
const ENVIRONMENTS = ['production', 'staging', 'development'];

interface BudgetAlert {
  id: string;
  name: string;
  threshold: number;
  periodType: 'daily' | 'weekly' | 'monthly';
  currentAmount: number;
  isActive: boolean;
  createdAt: Date;
  // Tag filters for this alert
  filterTeam: string | null;
  filterService: string | null;
  filterEnvironment: string | null;
}

export default function BudgetAlerts() {
  const { billingItems, totals, getDailyTrend } = useDemoData();
  const { toast } = useToast();
  const { sendNotification } = useBudgetNotifications();
  const { user } = useAuth();

  // Alert history state
  const [alertHistory] = useState(() => generateDemoHistory());
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  // Filter state for viewing alerts
  const [viewFilterTeam, setViewFilterTeam] = useState<string>('all');
  const [viewFilterService, setViewFilterService] = useState<string>('all');
  const [viewFilterEnvironment, setViewFilterEnvironment] = useState<string>('all');

  // Calculate costs for specific filters
  const calculateFilteredCost = (
    periodType: 'daily' | 'weekly' | 'monthly',
    team: string | null,
    service: string | null,
    environment: string | null
  ) => {
    const today = new Date();
    let cutoffDays = 1;
    if (periodType === 'weekly') cutoffDays = 7;
    if (periodType === 'monthly') cutoffDays = 30;

    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - cutoffDays);

    return billingItems
      .filter(item => {
        const itemDate = new Date(item.usage_date);
        if (itemDate < cutoff) return false;
        if (team && item.tag_team !== team) return false;
        if (service && item.service_name !== service) return false;
        if (environment && item.tag_environment !== environment) return false;
        return true;
      })
      .reduce((sum, item) => sum + item.cost, 0);
  };

  const dailyTrend = getDailyTrend();
  const last7Days = dailyTrend.slice(-7).reduce((sum, d) => sum + d.total, 0);
  const last30Days = dailyTrend.slice(-30).reduce((sum, d) => sum + d.total, 0);
  const today = dailyTrend[dailyTrend.length - 1]?.total || 0;

  // Demo budget alerts with tags
  const [alerts, setAlerts] = useState<BudgetAlert[]>([
    {
      id: '1',
      name: 'Monthly Cloud Budget',
      threshold: 50000,
      periodType: 'monthly',
      currentAmount: totals.thisMonth,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      filterTeam: null,
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: '2',
      name: 'Engineering Team Weekly',
      threshold: 8000,
      periodType: 'weekly',
      currentAmount: calculateFilteredCost('weekly', 'Engineering', null, null),
      isActive: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      filterTeam: 'Engineering',
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: '3',
      name: 'Production EC2 Daily',
      threshold: 800,
      periodType: 'daily',
      currentAmount: calculateFilteredCost('daily', null, 'EC2', 'production'),
      isActive: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      filterTeam: null,
      filterService: 'EC2',
      filterEnvironment: 'production',
    },
    {
      id: '4',
      name: 'DevOps S3 Monthly',
      threshold: 2000,
      periodType: 'monthly',
      currentAmount: calculateFilteredCost('monthly', 'DevOps', 'S3', null),
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      filterTeam: 'DevOps',
      filterService: 'S3',
      filterEnvironment: null,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    threshold: '',
    periodType: 'monthly' as 'daily' | 'weekly' | 'monthly',
    filterTeam: 'all',
    filterService: 'all',
    filterEnvironment: 'all',
  });

  const getCurrentAmount = (
    periodType: 'daily' | 'weekly' | 'monthly',
    team: string | null,
    service: string | null,
    environment: string | null
  ) => {
    if (team || service || environment) {
      return calculateFilteredCost(periodType, team, service, environment);
    }
    switch (periodType) {
      case 'daily':
        return today;
      case 'weekly':
        return last7Days;
      case 'monthly':
        return last30Days;
      default:
        return 0;
    }
  };

  const handleCreateAlert = () => {
    if (!newAlert.name || !newAlert.threshold) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const threshold = parseFloat(newAlert.threshold);
    if (isNaN(threshold) || threshold <= 0) {
      toast({
        title: 'Invalid threshold',
        description: 'Please enter a valid threshold amount.',
        variant: 'destructive',
      });
      return;
    }

    const team = newAlert.filterTeam === 'all' ? null : newAlert.filterTeam;
    const service = newAlert.filterService === 'all' ? null : newAlert.filterService;
    const environment = newAlert.filterEnvironment === 'all' ? null : newAlert.filterEnvironment;

    const alert: BudgetAlert = {
      id: Date.now().toString(),
      name: newAlert.name,
      threshold,
      periodType: newAlert.periodType,
      currentAmount: getCurrentAmount(newAlert.periodType, team, service, environment),
      isActive: true,
      createdAt: new Date(),
      filterTeam: team,
      filterService: service,
      filterEnvironment: environment,
    };

    setAlerts([...alerts, alert]);
    setNewAlert({
      name: '',
      threshold: '',
      periodType: 'monthly',
      filterTeam: 'all',
      filterService: 'all',
      filterEnvironment: 'all',
    });
    setIsDialogOpen(false);
    
    toast({
      title: 'Alert created',
      description: `Budget alert "${alert.name}" has been created.`,
    });
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast({
      title: 'Alert deleted',
      description: 'Budget alert has been removed.',
    });
  };

  const handleSendNotification = async (alert: BudgetAlert) => {
    if (!user?.email) {
      toast({
        title: 'No email found',
        description: 'Please sign in to send notifications.',
        variant: 'destructive',
      });
      return;
    }

    const status = getAlertStatus(alert);
    if (status === 'healthy') {
      toast({
        title: 'Alert is healthy',
        description: 'This alert has not exceeded its threshold.',
      });
      return;
    }

    setSendingAlertId(alert.id);
    await sendNotification({
      alertName: alert.name,
      recipientEmail: user.email,
      threshold: alert.threshold,
      currentAmount: alert.currentAmount,
      periodType: alert.periodType,
      status: status as 'exceeded' | 'warning',
      filterTeam: alert.filterTeam,
      filterService: alert.filterService,
      filterEnvironment: alert.filterEnvironment,
    });
    setSendingAlertId(null);
  };

  const getAlertStatus = (alert: BudgetAlert) => {
    const percentage = (alert.currentAmount / alert.threshold) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'healthy';
  };

  // Filter alerts based on view filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (viewFilterTeam !== 'all' && alert.filterTeam !== viewFilterTeam && alert.filterTeam !== null) {
        return false;
      }
      if (viewFilterService !== 'all' && alert.filterService !== viewFilterService && alert.filterService !== null) {
        return false;
      }
      if (viewFilterEnvironment !== 'all' && alert.filterEnvironment !== viewFilterEnvironment && alert.filterEnvironment !== null) {
        return false;
      }
      return true;
    });
  }, [alerts, viewFilterTeam, viewFilterService, viewFilterEnvironment]);

  const exceededAlerts = filteredAlerts.filter(a => getAlertStatus(a) === 'exceeded');
  const warningAlerts = filteredAlerts.filter(a => getAlertStatus(a) === 'warning');

  const hasActiveFilters = viewFilterTeam !== 'all' || viewFilterService !== 'all' || viewFilterEnvironment !== 'all';

  const clearFilters = () => {
    setViewFilterTeam('all');
    setViewFilterService('all');
    setViewFilterEnvironment('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Set spending thresholds and get notified when costs exceed limits
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Budget Alert</DialogTitle>
              <DialogDescription>
                Set a spending threshold and optionally filter by team, service, or environment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Alert Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Monthly Production Budget"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold ($)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="e.g., 10000"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={newAlert.periodType}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setNewAlert({ ...newAlert, periodType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">Filter by Tags (Optional)</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="team" className="text-xs text-muted-foreground">Team</Label>
                    <Select
                      value={newAlert.filterTeam}
                      onValueChange={(value) => setNewAlert({ ...newAlert, filterTeam: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Teams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {TEAMS.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-xs text-muted-foreground">Service</Label>
                    <Select
                      value={newAlert.filterService}
                      onValueChange={(value) => setNewAlert({ ...newAlert, filterService: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {SERVICES.map(service => (
                          <SelectItem key={service} value={service}>{service}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment" className="text-xs text-muted-foreground">Environment</Label>
                    <Select
                      value={newAlert.filterEnvironment}
                      onValueChange={(value) => setNewAlert({ ...newAlert, filterEnvironment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Environments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Environments</SelectItem>
                        {ENVIRONMENTS.map(env => (
                          <SelectItem key={env} value={env} className="capitalize">{env}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAlert}>Create Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filter Alerts:
            </div>
            <Select value={viewFilterTeam} onValueChange={setViewFilterTeam}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {TEAMS.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={viewFilterService} onValueChange={setViewFilterService}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {SERVICES.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={viewFilterEnvironment} onValueChange={setViewFilterEnvironment}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                {ENVIRONMENTS.map(env => (
                  <SelectItem key={env} value={env} className="capitalize">{env}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={exceededAlerts.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Exceeded Budgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-destructive">{exceededAlerts.length}</span>
              {exceededAlerts.length > 0 && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={warningAlerts.length > 0 ? 'border-warning' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approaching Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-warning">{warningAlerts.length}</span>
              {warningAlerts.length > 0 && (
                <Bell className="h-5 w-5 text-warning" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{filteredAlerts.filter(a => a.isActive).length}</span>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {hasActiveFilters ? 'Filtered Budget Alerts' : 'All Budget Alerts'}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredAlerts.length} of {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Monitor your spending against defined thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{hasActiveFilters ? 'No alerts match your filters' : 'No budget alerts configured'}</p>
              <p className="text-sm">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first alert to start monitoring spending'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const status = getAlertStatus(alert);
                const percentage = Math.min((alert.currentAmount / alert.threshold) * 100, 100);
                const hasTags = alert.filterTeam || alert.filterService || alert.filterEnvironment;
                
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      status === 'exceeded'
                        ? 'border-destructive bg-destructive/5'
                        : status === 'warning'
                        ? 'border-warning bg-warning/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{alert.name}</h3>
                          <Badge
                            variant={
                              status === 'exceeded'
                                ? 'destructive'
                                : status === 'warning'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {status === 'exceeded'
                              ? 'Exceeded'
                              : status === 'warning'
                              ? 'Warning'
                              : 'Healthy'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {alert.periodType} budget
                        </p>
                        {hasTags && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {alert.filterTeam && (
                              <Badge variant="outline" className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/30">
                                {alert.filterTeam}
                              </Badge>
                            )}
                            {alert.filterService && (
                              <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/30">
                                {alert.filterService}
                              </Badge>
                            )}
                            {alert.filterEnvironment && (
                              <Badge variant="outline" className="text-xs bg-chart-3/10 text-chart-3 border-chart-3/30 capitalize">
                                {alert.filterEnvironment}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {status !== 'healthy' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendNotification(alert)}
                            disabled={sendingAlertId === alert.id}
                            className="text-muted-foreground hover:text-primary"
                            title="Send email notification"
                          >
                            {sendingAlertId === alert.id ? (
                              <Send className="h-4 w-4 animate-pulse" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          ${alert.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-muted-foreground">
                          ${alert.threshold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className={`h-2 ${
                          status === 'exceeded'
                            ? '[&>div]:bg-destructive'
                            : status === 'warning'
                            ? '[&>div]:bg-warning'
                            : '[&>div]:bg-success'
                        }`}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {percentage.toFixed(1)}% of budget used
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <AlertHistory history={alertHistory} />
    </div>
  );
}
