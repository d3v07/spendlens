import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, AlertTriangle, TrendingUp, TrendingDown, DollarSign, 
  BarChart3, PieChart
} from 'lucide-react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { TeamCostDetail } from '@/components/TeamCostDetail';
import { TeamOverageAlerts } from '@/components/TeamOverageAlerts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function TeamAllocationDashboard() {
  const { getTeamBudgets, getTeamBreakdown } = useDemoData();
  const teamBudgets = getTeamBudgets();
  const teamBreakdown = getTeamBreakdown();
  
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalBudget = teamBudgets.reduce((sum, t) => sum + t.monthlyBudget, 0);
    const totalSpend = teamBudgets.reduce((sum, t) => sum + t.currentSpend, 0);
    const overBudgetCount = teamBudgets.filter(t => t.currentSpend > t.monthlyBudget).length;
    const atRiskCount = teamBudgets.filter(t => {
      const pct = (t.currentSpend / t.monthlyBudget) * 100;
      return pct >= t.alertThreshold && pct <= 100;
    }).length;

    return { totalBudget, totalSpend, overBudgetCount, atRiskCount };
  }, [teamBudgets]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const budgetChartData = teamBudgets.map(team => ({
    name: team.teamName,
    budget: team.monthlyBudget,
    spend: team.currentSpend,
    variance: team.monthlyBudget - team.currentSpend,
  }));

  if (selectedTeam) {
    const team = teamBudgets.find(t => t.teamName === selectedTeam);
    if (team) {
      return (
        <TeamCostDetail 
          team={team} 
          onBack={() => setSelectedTeam(null)} 
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Budget
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.totalBudget)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Current Spend
            </CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.totalSpend)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress 
              value={(stats.totalSpend / stats.totalBudget) * 100} 
              className="h-2" 
            />
          </CardContent>
        </Card>
        <Card className={stats.overBudgetCount > 0 ? 'border-red-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" /> Over Budget
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.overBudgetCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={stats.atRiskCount > 0 ? 'border-amber-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-amber-500" /> At Risk
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.atRiskCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Overage Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Team Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamBudgets.map((team, idx) => {
              const utilizationPct = (team.currentSpend / team.monthlyBudget) * 100;
              const isOverBudget = utilizationPct > 100;
              const isAtRisk = utilizationPct >= team.alertThreshold && !isOverBudget;
              const trend = team.previousMonthSpend > 0
                ? ((team.currentSpend - team.previousMonthSpend) / team.previousMonthSpend) * 100
                : 0;

              return (
                <Card 
                  key={team.teamName}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isOverBudget ? 'border-red-500/50' : isAtRisk ? 'border-amber-500/50' : ''
                  }`}
                  onClick={() => setSelectedTeam(team.teamName)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {team.teamName}
                      </CardTitle>
                      {isOverBudget ? (
                        <Badge variant="destructive">Over Budget</Badge>
                      ) : isAtRisk ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          At Risk
                        </Badge>
                      ) : (
                        <Badge variant="outline">On Track</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spend</span>
                      <span className="font-medium">
                        {formatCurrency(team.currentSpend)} / {formatCurrency(team.monthlyBudget)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(utilizationPct, 100)} 
                      className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : isAtRisk ? '[&>div]:bg-amber-500' : ''}`}
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        {utilizationPct.toFixed(0)}% utilized
                      </span>
                      <span className={`flex items-center gap-1 ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(trend).toFixed(1)}% vs last month
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget vs Spend by Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                      <Bar dataKey="budget" fill="hsl(var(--muted))" name="Budget" />
                      <Bar dataKey="spend" name="Spend">
                        {budgetChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.spend > entry.budget ? 'hsl(0 84% 60%)' : 'hsl(var(--primary))'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spend Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={teamBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {teamBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <TeamOverageAlerts teamBudgets={teamBudgets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
