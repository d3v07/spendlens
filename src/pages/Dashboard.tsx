import { useState, useEffect } from 'react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Lightbulb } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import { ServiceFilter } from '@/components/ServiceFilter';
import { ExportButton } from '@/components/ExportButton';
import { TopCostDriversTable } from '@/components/TopCostDriversTable';
import { EnvironmentBreakdownChart } from '@/components/EnvironmentBreakdownChart';
import { UnallocatedSpendCard } from '@/components/UnallocatedSpendCard';
import { CostUnitMetrics } from '@/components/CostUnitMetrics';
import { AnomaliesPanel } from '@/components/AnomaliesPanel';
import { DemoProfileSwitcher } from '@/components/DemoProfileSwitcher';
import { OnboardingWizard, useOnboarding } from '@/components/OnboardingWizard';
import { CostForecastPanel } from '@/components/CostForecastPanel';
import { CostComparisonView } from '@/components/CostComparisonView';
import { TaggingAuditPanel } from '@/components/TaggingAuditPanel';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(271, 100%, 65%)', 'hsl(338, 100%, 63%)', 'hsl(199, 89%, 48%)'];

export default function Dashboard() {
  const { isComplete: onboardingComplete } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { 
    totals, 
    recommendations,
    anomalies,
    billingItems,
    filters,
    setFilters,
    availableServices,
    currentProfile,
    profiles,
    setProfile,
    acknowledgeAnomaly,
    dismissAnomaly,
    resetDemoData,
    getServiceBreakdown, 
    getTeamBreakdown, 
    getEnvironmentBreakdown,
    getDailyTrend,
    getTopCostDrivers,
    getUnallocatedSpend,
    getCostUnitMetrics,
  } = useDemoData();

  useEffect(() => {
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [onboardingComplete]);
  
  const serviceData = getServiceBreakdown().slice(0, 6);
  const teamData = getTeamBreakdown();
  const environmentData = getEnvironmentBreakdown();
  const trendData = getDailyTrend();
  const topDrivers = getTopCostDrivers();
  const unallocated = getUnallocatedSpend();
  const costMetrics = getCostUnitMetrics();
  const totalSavings = recommendations.reduce((sum, r) => sum + r.projected_savings, 0);

  const exportData = billingItems.map(item => ({
    date: item.usage_date,
    service: item.service_name,
    cost: item.cost,
    team: item.tag_team || 'Unallocated',
    environment: item.tag_environment,
    region: item.region,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Demo Profile Switcher */}
      <DemoProfileSwitcher
        currentProfile={currentProfile}
        profiles={profiles}
        onProfileChange={setProfile}
        onReset={resetDemoData}
      />

      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your cloud cost overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter 
            value={String(filters.days) as DateRange} 
            onChange={(v) => setFilters({ days: parseInt(v) })} 
          />
          <ServiceFilter 
            services={availableServices} 
            value={filters.service} 
            onChange={(v) => setFilters({ service: v })} 
          />
          <ExportButton data={exportData} filename="spendlens-cost-data" title="Cloud Cost Report" />
        </div>
      </div>

      {/* Anomalies Panel */}
      {anomalies.length > 0 && (
        <AnomaliesPanel
          anomalies={anomalies}
          onAcknowledge={acknowledgeAnomaly}
          onDismiss={dismissAnomaly}
        />
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.thisMonth.toLocaleString()}</div>
            <div className={`flex items-center text-sm ${totals.change > 0 ? 'text-destructive' : 'text-success'}`}>
              {totals.change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(totals.change)}% vs last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.lastMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <Lightbulb className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalSavings.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">{recommendations.length} recommendations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceData[0]?.name || 'N/A'}</div>
            <p className="text-sm text-muted-foreground">${serviceData[0]?.value.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unallocated Spend Warning */}
      <UnallocatedSpendCard unallocatedAmount={unallocated.amount} totalAmount={unallocated.total} />

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cost Trend ({filters.days} Days)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={12} />
                <YAxis tickFormatter={(v) => `$${v}`} fontSize={12} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
                <Area type="monotone" dataKey="total" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Spend by Service</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Spend by Team</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <EnvironmentBreakdownChart data={environmentData} />
        <CostUnitMetrics metrics={costMetrics} />
      </div>

      {/* Cost Forecast */}
      <CostForecastPanel 
        dailyTrend={trendData}
        currentMonthSpend={totals.thisMonth}
        potentialSavings={totalSavings}
      />

      {/* Cost Comparison View */}
      <CostComparisonView />

      {/* Tagging Audit */}
      <TaggingAuditPanel />

      {/* Top Cost Drivers Table */}
      <TopCostDriversTable data={topDrivers} />
    </div>
  );
}
