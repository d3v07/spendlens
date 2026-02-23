import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Mail, DollarSign } from 'lucide-react';
import { TeamBudget } from '@/lib/demo-data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface TeamCostDetailProps {
  team: TeamBudget;
  onBack: () => void;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function TeamCostDetail({ team, onBack }: TeamCostDetailProps) {
  const utilizationPct = (team.currentSpend / team.monthlyBudget) * 100;
  const isOverBudget = utilizationPct > 100;
  const trend = team.previousMonthSpend > 0
    ? ((team.currentSpend - team.previousMonthSpend) / team.previousMonthSpend) * 100
    : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  // Generate daily trend data
  const dailyTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const baseSpend = team.currentSpend / 30;
    const variance = (Math.random() - 0.5) * 0.4;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spend: Math.max(0, baseSpend * (1 + variance)),
      budget: team.monthlyBudget / 30,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-muted-foreground" />
              {team.teamName}
            </h1>
            {isOverBudget ? (
              <Badge variant="destructive">Over Budget</Badge>
            ) : utilizationPct >= team.alertThreshold ? (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">At Risk</Badge>
            ) : (
              <Badge variant="outline">On Track</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Budget Owner: {team.budgetOwner} • Alert Threshold: {team.alertThreshold}%
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Budget</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(team.monthlyBudget)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={isOverBudget ? 'border-red-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Current Spend</CardDescription>
            <CardTitle className={`text-2xl ${isOverBudget ? 'text-red-600' : ''}`}>
              {formatCurrency(team.currentSpend)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress 
              value={Math.min(utilizationPct, 100)} 
              className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`} 
            />
            <p className="text-xs text-muted-foreground mt-1">{utilizationPct.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className={`text-2xl ${team.monthlyBudget - team.currentSpend < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(team.monthlyBudget - team.currentSpend)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>vs Last Month</CardDescription>
            <CardTitle className={`text-2xl flex items-center gap-1 ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trend > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {Math.abs(trend).toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Spend Trend</CardTitle>
            <CardDescription>Last 30 days vs daily budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="budget" 
                    stroke="hsl(var(--muted-foreground))" 
                    fill="hsl(var(--muted))"
                    strokeDasharray="5 5"
                    name="Daily Budget"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spend" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)"
                    name="Daily Spend"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Breakdown</CardTitle>
            <CardDescription>Cost allocation by service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={team.services} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Bar dataKey="cost" name="Cost">
                    {team.services.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.services.map((service, idx) => {
              const pct = (service.cost / team.currentSpend) * 100;
              return (
                <div key={service.name} className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(service.cost)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
