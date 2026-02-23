import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Minus, GitCompare, Calendar, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useDemoData } from '@/contexts/DemoDataContext';

type ComparisonType = 'period' | 'environment';

interface ComparisonData {
  name: string;
  baseline: number;
  comparison: number;
  change: number;
  changePercent: number;
}

const CHART_COLORS = {
  baseline: 'hsl(221, 83%, 53%)',
  comparison: 'hsl(142, 71%, 45%)',
  increase: 'hsl(0, 84%, 60%)',
  decrease: 'hsl(142, 71%, 45%)',
};

export function CostComparisonView() {
  const { billingItems } = useDemoData();
  const [comparisonType, setComparisonType] = useState<ComparisonType>('period');
  const [periodA, setPeriodA] = useState('last-30');
  const [periodB, setPeriodB] = useState('previous-30');
  const [envA, setEnvA] = useState('production');
  const [envB, setEnvB] = useState('staging');

  const periodOptions = [
    { value: 'last-7', label: 'Last 7 days' },
    { value: 'last-14', label: 'Last 14 days' },
    { value: 'last-30', label: 'Last 30 days' },
    { value: 'previous-30', label: 'Previous 30 days' },
    { value: 'last-60', label: 'Last 60 days' },
  ];

  const environmentOptions = [
    { value: 'production', label: 'Production' },
    { value: 'staging', label: 'Staging' },
    { value: 'development', label: 'Development' },
  ];

  const getPeriodDates = (period: string): { start: Date; end: Date } => {
    const today = new Date();
    const end = new Date(today);
    let start = new Date(today);

    switch (period) {
      case 'last-7':
        start.setDate(today.getDate() - 7);
        break;
      case 'last-14':
        start.setDate(today.getDate() - 14);
        break;
      case 'last-30':
        start.setDate(today.getDate() - 30);
        break;
      case 'previous-30':
        start.setDate(today.getDate() - 60);
        end.setDate(today.getDate() - 30);
        break;
      case 'last-60':
        start.setDate(today.getDate() - 60);
        break;
    }

    return { start, end };
  };

  const comparisonData = useMemo((): ComparisonData[] => {
    if (comparisonType === 'period') {
      const { start: startA, end: endA } = getPeriodDates(periodA);
      const { start: startB, end: endB } = getPeriodDates(periodB);

      const serviceDataA: Record<string, number> = {};
      const serviceDataB: Record<string, number> = {};

      billingItems.forEach(item => {
        const date = new Date(item.usage_date);
        
        if (date >= startA && date <= endA) {
          serviceDataA[item.service_name] = (serviceDataA[item.service_name] || 0) + item.cost;
        }
        if (date >= startB && date <= endB) {
          serviceDataB[item.service_name] = (serviceDataB[item.service_name] || 0) + item.cost;
        }
      });

      const services = new Set([...Object.keys(serviceDataA), ...Object.keys(serviceDataB)]);
      
      return Array.from(services).map(service => {
        const baseline = serviceDataB[service] || 0;
        const comparison = serviceDataA[service] || 0;
        const change = comparison - baseline;
        const changePercent = baseline > 0 ? (change / baseline) * 100 : 0;

        return {
          name: service,
          baseline: Math.round(baseline * 100) / 100,
          comparison: Math.round(comparison * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 10) / 10,
        };
      }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    } else {
      // Environment comparison
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const serviceDataA: Record<string, number> = {};
      const serviceDataB: Record<string, number> = {};

      billingItems.forEach(item => {
        const date = new Date(item.usage_date);
        if (date >= thirtyDaysAgo) {
          if (item.tag_environment === envA) {
            serviceDataA[item.service_name] = (serviceDataA[item.service_name] || 0) + item.cost;
          }
          if (item.tag_environment === envB) {
            serviceDataB[item.service_name] = (serviceDataB[item.service_name] || 0) + item.cost;
          }
        }
      });

      const services = new Set([...Object.keys(serviceDataA), ...Object.keys(serviceDataB)]);
      
      return Array.from(services).map(service => {
        const baseline = serviceDataB[service] || 0;
        const comparison = serviceDataA[service] || 0;
        const change = comparison - baseline;
        const changePercent = baseline > 0 ? (change / baseline) * 100 : 0;

        return {
          name: service,
          baseline: Math.round(baseline * 100) / 100,
          comparison: Math.round(comparison * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 10) / 10,
        };
      }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }
  }, [billingItems, comparisonType, periodA, periodB, envA, envB]);

  const totals = useMemo(() => {
    const baseline = comparisonData.reduce((sum, d) => sum + d.baseline, 0);
    const comparison = comparisonData.reduce((sum, d) => sum + d.comparison, 0);
    const change = comparison - baseline;
    const changePercent = baseline > 0 ? (change / baseline) * 100 : 0;
    return { baseline, comparison, change, changePercent };
  }, [comparisonData]);

  const baselineLabel = comparisonType === 'period' 
    ? periodOptions.find(p => p.value === periodB)?.label 
    : environmentOptions.find(e => e.value === envB)?.label;
  
  const comparisonLabel = comparisonType === 'period'
    ? periodOptions.find(p => p.value === periodA)?.label
    : environmentOptions.find(e => e.value === envA)?.label;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Cost Comparison
          </CardTitle>
          
          <Tabs value={comparisonType} onValueChange={(v) => setComparisonType(v as ComparisonType)}>
            <TabsList>
              <TabsTrigger value="period" className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Time Periods
              </TabsTrigger>
              <TabsTrigger value="environment" className="gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Environments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Comparison Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {comparisonType === 'period' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Compare</span>
                <Select value={periodA} onValueChange={setPeriodA}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground">vs</span>
              <Select value={periodB} onValueChange={setPeriodB}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Compare</span>
                <Select value={envA} onValueChange={setEnvA}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {environmentOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground">vs</span>
              <Select value={envB} onValueChange={setEnvB}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environmentOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">{baselineLabel}</p>
            <p className="text-2xl font-bold">${totals.baseline.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">{comparisonLabel}</p>
            <p className="text-2xl font-bold">${totals.comparison.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg ${totals.change >= 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
            <p className="text-sm text-muted-foreground">Difference</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${totals.change >= 0 ? 'text-destructive' : 'text-success'}`}>
                {totals.change >= 0 ? '+' : ''}${totals.change.toLocaleString()}
              </p>
              <Badge variant={totals.change >= 0 ? 'destructive' : 'default'} className={totals.change < 0 ? 'bg-success' : ''}>
                {totals.change >= 0 ? '+' : ''}{totals.changePercent.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData.slice(0, 8)} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
              <YAxis type="category" dataKey="name" fontSize={12} width={80} />
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="baseline" name={baselineLabel} fill={CHART_COLORS.baseline} radius={[0, 4, 4, 0]} />
              <Bar dataKey="comparison" name={comparisonLabel} fill={CHART_COLORS.comparison} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Service</th>
                <th className="text-right p-3 font-medium">{baselineLabel}</th>
                <th className="text-right p-3 font-medium">{comparisonLabel}</th>
                <th className="text-right p-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comparisonData.slice(0, 10).map((item) => (
                <tr key={item.name} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-right font-mono">${item.baseline.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">${item.comparison.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.change > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      ) : item.change < 0 ? (
                        <ArrowDownRight className="h-4 w-4 text-success" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={item.change > 0 ? 'text-destructive' : item.change < 0 ? 'text-success' : ''}>
                        {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
