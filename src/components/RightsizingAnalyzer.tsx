import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Cpu, HardDrive, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, 
  XCircle, ArrowRight, Server, Database, Download
} from 'lucide-react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { analyzeRightsizing, EC2_INSTANCES, RDS_INSTANCES, RightsizingRecommendation } from '@/lib/instance-types';

const recommendationColors: Record<RightsizingRecommendation, string> = {
  downsize: 'bg-green-500/10 text-green-600 border-green-500/20',
  upsize: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  optimal: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  terminate: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const recommendationIcons: Record<RightsizingRecommendation, React.ReactNode> = {
  downsize: <TrendingDown className="h-4 w-4" />,
  upsize: <TrendingUp className="h-4 w-4" />,
  optimal: <CheckCircle className="h-4 w-4" />,
  terminate: <XCircle className="h-4 w-4" />,
};

export function RightsizingAnalyzer() {
  const { getResourceUtilization } = useDemoData();
  const resources = getResourceUtilization();
  
  const [serviceFilter, setServiceFilter] = useState<'all' | 'EC2' | 'RDS'>('all');
  const [recommendationFilter, setRecommendationFilter] = useState<string>('all');

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (serviceFilter !== 'all' && r.resourceType !== serviceFilter) return false;
      if (recommendationFilter !== 'all' && r.recommendation !== recommendationFilter) return false;
      return true;
    });
  }, [resources, serviceFilter, recommendationFilter]);

  const stats = useMemo(() => {
    const total = resources.length;
    const downsizeCount = resources.filter(r => r.recommendation === 'downsize').length;
    const upsizeCount = resources.filter(r => r.recommendation === 'upsize').length;
    const terminateCount = resources.filter(r => r.recommendation === 'terminate').length;
    const optimalCount = resources.filter(r => r.recommendation === 'optimal').length;
    const totalSavings = resources
      .filter(r => r.potentialSavings > 0)
      .reduce((sum, r) => sum + r.potentialSavings, 0);

    return { total, downsizeCount, upsizeCount, terminateCount, optimalCount, totalSavings };
  }, [resources]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resources Analyzed</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-green-500" /> Downsize
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.downsizeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-amber-500" /> Upsize
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.upsizeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" /> Terminate
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.terminateCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Potential Savings</CardDescription>
            <CardTitle className="text-2xl text-primary">{formatCurrency(stats.totalSavings)}/mo</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v as typeof serviceFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="EC2">EC2</SelectItem>
            <SelectItem value="RDS">RDS</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Recommendation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recommendations</SelectItem>
            <SelectItem value="downsize">Downsize</SelectItem>
            <SelectItem value="upsize">Upsize</SelectItem>
            <SelectItem value="terminate">Terminate</SelectItem>
            <SelectItem value="optimal">Optimal</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Resources Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Instance Type</TableHead>
                <TableHead>CPU Utilization</TableHead>
                <TableHead>Memory Utilization</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource) => (
                <TableRow key={resource.resourceId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {resource.resourceType === 'EC2' ? (
                        <Server className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Database className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{resource.resourceId}</div>
                        <div className="text-xs text-muted-foreground">
                          {resource.team} • {resource.environment}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{resource.instanceType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Avg: {resource.cpuAvg}%</span>
                        <span>Max: {resource.cpuMax}%</span>
                      </div>
                      <Progress 
                        value={resource.cpuAvg} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Avg: {resource.memoryAvg}%</span>
                        <span>Max: {resource.memoryMax}%</span>
                      </div>
                      <Progress 
                        value={resource.memoryAvg} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(resource.monthlyCost)}</span>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Badge className={recommendationColors[resource.recommendation]}>
                            {recommendationIcons[resource.recommendation]}
                            <span className="ml-1 capitalize">{resource.recommendation}</span>
                          </Badge>
                          {resource.recommendedType && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              {resource.recommendedType}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{resource.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {resource.potentialSavings > 0 ? (
                      <span className="text-green-600 font-medium">
                        {formatCurrency(resource.potentialSavings)}/mo
                      </span>
                    ) : resource.potentialSavings < 0 ? (
                      <span className="text-amber-600 text-sm">
                        +{formatCurrency(Math.abs(resource.potentialSavings))}/mo
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
