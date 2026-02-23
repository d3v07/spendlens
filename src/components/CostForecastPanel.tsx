import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, ReferenceLine, ComposedChart, Bar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, Target, 
  AlertTriangle, Sparkles, DollarSign, ArrowRight
} from 'lucide-react';
import { generateForecast, analyzeTrend, projectMonthlyTotals, calculateSavingsScenario } from '@/lib/forecasting';

interface DailyData {
  date: string;
  total: number;
}

interface CostForecastPanelProps {
  dailyTrend: DailyData[];
  currentMonthSpend: number;
  potentialSavings: number;
}

export function CostForecastPanel({ dailyTrend, currentMonthSpend, potentialSavings }: CostForecastPanelProps) {
  const [forecastDays, setForecastDays] = useState<string>('30');
  const [activeTab, setActiveTab] = useState('forecast');

  const historicalData = useMemo(() => 
    dailyTrend.map(d => ({ date: d.date, value: d.total })),
    [dailyTrend]
  );

  const trendAnalysis = useMemo(() => 
    analyzeTrend(historicalData),
    [historicalData]
  );

  const forecastData = useMemo(() => 
    generateForecast(historicalData, parseInt(forecastDays)),
    [historicalData, forecastDays]
  );

  const monthlyProjections = useMemo(() => 
    projectMonthlyTotals(forecastData, 3),
    [forecastData]
  );

  const savingsScenario = useMemo(() => {
    const savingsPercent = currentMonthSpend > 0 
      ? (potentialSavings / currentMonthSpend) * 100 
      : 10;
    return calculateSavingsScenario(currentMonthSpend, savingsPercent, 6);
  }, [currentMonthSpend, potentialSavings]);

  // Calculate projected next month total
  const nextMonthProjected = useMemo(() => {
    const projections = forecastData.filter(d => d.isProjection);
    return projections.slice(0, 30).reduce((sum, d) => sum + d.forecast, 0);
  }, [forecastData]);

  const TrendIcon = trendAnalysis.trend === 'increasing' 
    ? TrendingUp 
    : trendAnalysis.trend === 'decreasing' 
    ? TrendingDown 
    : Minus;

  const trendColor = trendAnalysis.trend === 'increasing' 
    ? 'text-destructive' 
    : trendAnalysis.trend === 'decreasing' 
    ? 'text-success' 
    : 'text-muted-foreground';

  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Cost Forecast
            </CardTitle>
            <CardDescription>
              Predicted spending based on historical trends
            </CardDescription>
          </div>
          <Select value={forecastDays} onValueChange={setForecastDays}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              Trend
            </div>
            <div className={`text-xl font-bold capitalize ${trendColor}`}>
              {trendAnalysis.trend}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {trendAnalysis.trend === 'increasing' ? '+' : ''}
              {formatCurrency(trendAnalysis.slope)}/day
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Next Month
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(nextMonthProjected)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Projected total
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Confidence
            </div>
            <div className="text-xl font-bold">
              {(trendAnalysis.rSquared * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Model accuracy
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              Volatility
            </div>
            <div className="text-xl font-bold">
              {trendAnalysis.volatility.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Cost variation
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="forecast">Daily Forecast</TabsTrigger>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
            <TabsTrigger value="savings">If Optimized</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="mt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate} 
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                    fontSize={12}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'actual' ? 'Actual' : 
                      name === 'forecast' ? 'Forecast' :
                      name === 'upperBound' ? 'Upper Bound' : 'Lower Bound'
                    ]}
                    labelFormatter={formatDate}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  
                  {/* Confidence interval area */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="url(#confidenceGradient)"
                    fillOpacity={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="hsl(var(--background))"
                    fillOpacity={1}
                  />
                  
                  {/* Forecast line */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  
                  {/* Actual data */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(221, 83%, 53%)"
                    strokeWidth={2}
                    dot={false}
                  />

                  {/* Reference line for today */}
                  <ReferenceLine
                    x={historicalData[historicalData.length - 1]?.date}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="3 3"
                    label={{ value: 'Today', position: 'top', fontSize: 11 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 bg-success" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(142, 71%, 45%) 0, hsl(142, 71%, 45%) 4px, transparent 4px, transparent 8px)' }} />
                <span className="text-muted-foreground">Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-6 rounded bg-success/20" />
                <span className="text-muted-foreground">95% Confidence</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-4">
            <div className="space-y-4">
              {monthlyProjections.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {monthlyProjections.map((month, i) => {
                      const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const changeFromCurrent = ((month.projected - currentMonthSpend) / currentMonthSpend) * 100;
                      
                      return (
                        <div key={month.month} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{monthName}</span>
                            {i === 0 && <Badge variant="secondary">Next Month</Badge>}
                          </div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(month.projected)}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Range: {formatCurrency(month.lower)} - {formatCurrency(month.upper)}
                          </div>
                          <div className={`mt-1 text-sm flex items-center gap-1 ${changeFromCurrent > 0 ? 'text-destructive' : 'text-success'}`}>
                            {changeFromCurrent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {changeFromCurrent > 0 ? '+' : ''}{changeFromCurrent.toFixed(1)}% vs current
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyProjections.map(m => ({
                        month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                        projected: m.projected,
                        range: [m.lower, m.upper],
                        current: currentMonthSpend,
                      }))}>
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={12} width={60} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="projected" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                        <ReferenceLine y={currentMonthSpend} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Not enough data for monthly projections
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="savings" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">If you implement all recommendations</div>
                    <div className="text-sm text-muted-foreground">
                      Save {formatCurrency(potentialSavings)}/month ({((potentialSavings / currentMonthSpend) * 100).toFixed(0)}% reduction)
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                  <div className="text-right">
                    <div className="text-xl font-bold text-success">
                      {formatCurrency(potentialSavings * 12)}
                    </div>
                    <div className="text-sm text-muted-foreground">Yearly savings</div>
                  </div>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsScenario}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(v) => `Month ${v}`}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      fontSize={12}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'baseline' ? 'Without Optimization' :
                        name === 'optimized' ? 'With Optimization' : 'Cumulative Savings'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="hsl(142, 71%, 45%)"
                      fill="url(#savingsGradient)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="optimized"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 4px, transparent 4px, transparent 8px)' }} />
                  <span className="text-muted-foreground">Without Optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-primary" />
                  <span className="text-muted-foreground">With Optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 rounded bg-success/30" />
                  <span className="text-muted-foreground">Cumulative Savings</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
