import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Bell, Mail, TrendingUp, Users, Clock } from 'lucide-react';
import { TeamBudget } from '@/lib/demo-data';
import { toast } from '@/hooks/use-toast';

interface TeamOverageAlertsProps {
  teamBudgets: TeamBudget[];
}

export function TeamOverageAlerts({ teamBudgets }: TeamOverageAlertsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const alertTeams = teamBudgets
    .map(team => {
      const pct = (team.currentSpend / team.monthlyBudget) * 100;
      return {
        ...team,
        utilizationPct: pct,
        isOverBudget: pct > 100,
        isAtRisk: pct >= team.alertThreshold && pct <= 100,
        overage: Math.max(0, team.currentSpend - team.monthlyBudget),
      };
    })
    .filter(t => t.isOverBudget || t.isAtRisk)
    .sort((a, b) => b.utilizationPct - a.utilizationPct);

  const handleNotify = (teamName: string, email: string) => {
    toast({
      title: "Notification Sent",
      description: `Alert sent to ${email} for ${teamName} budget overage.`,
    });
  };

  if (alertTeams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-4">
            <Bell className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium">All Teams On Track</h3>
          <p className="text-muted-foreground mt-1">
            No teams are currently at risk or over budget
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <p className="text-sm text-muted-foreground">
            {alertTeams.filter(t => t.isOverBudget).length} over budget, 
            {' '}{alertTeams.filter(t => t.isAtRisk).length} at risk
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            alertTeams.forEach(t => handleNotify(t.teamName, t.budgetOwner));
          }}
        >
          <Mail className="h-4 w-4 mr-2" /> Notify All
        </Button>
      </div>

      <div className="space-y-3">
        {alertTeams.map((team) => (
          <Card 
            key={team.teamName}
            className={team.isOverBudget ? 'border-red-500/50' : 'border-amber-500/50'}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  team.isOverBudget ? 'bg-red-500/10' : 'bg-amber-500/10'
                }`}>
                  {team.isOverBudget ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{team.teamName}</span>
                    <Badge 
                      variant={team.isOverBudget ? 'destructive' : 'outline'}
                      className={!team.isOverBudget ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
                    >
                      {team.isOverBudget ? 'Over Budget' : 'At Risk'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> Owner: {team.budgetOwner}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Threshold: {team.alertThreshold}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {formatCurrency(team.currentSpend)} / {formatCurrency(team.monthlyBudget)}
                      </span>
                      <span className={team.isOverBudget ? 'text-red-600 font-medium' : 'text-amber-600'}>
                        {team.utilizationPct.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(team.utilizationPct, 100)} 
                      className={`h-2 ${team.isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
                    />
                    {team.isOverBudget && (
                      <p className="text-xs text-red-600">
                        Overage: {formatCurrency(team.overage)}
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleNotify(team.teamName, team.budgetOwner)}
                >
                  <Bell className="h-4 w-4 mr-1" /> Notify
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
