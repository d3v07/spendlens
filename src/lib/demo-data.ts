// Demo data generator for SpendLens
// Creates realistic cloud billing data for demonstration

const SERVICES = [
  { name: 'EC2', category: 'Compute', baseDaily: 450, variance: 0.15 },
  { name: 'S3', category: 'Storage', baseDaily: 120, variance: 0.1 },
  { name: 'RDS', category: 'Database', baseDaily: 280, variance: 0.08 },
  { name: 'Lambda', category: 'Compute', baseDaily: 85, variance: 0.25 },
  { name: 'CloudWatch', category: 'Monitoring', baseDaily: 45, variance: 0.12 },
  { name: 'CloudFront', category: 'Networking', baseDaily: 95, variance: 0.2 },
  { name: 'DynamoDB', category: 'Database', baseDaily: 65, variance: 0.18 },
  { name: 'EBS', category: 'Storage', baseDaily: 78, variance: 0.05 },
  { name: 'EKS', category: 'Containers', baseDaily: 180, variance: 0.1 },
  { name: 'ElastiCache', category: 'Database', baseDaily: 110, variance: 0.08 },
  { name: 'Route53', category: 'Networking', baseDaily: 12, variance: 0.05 },
  { name: 'API Gateway', category: 'Networking', baseDaily: 35, variance: 0.3 },
];

const TEAMS = ['Engineering', 'Data', 'Platform', 'DevOps', 'ML'];
const ENVIRONMENTS = ['production', 'staging', 'development'];
const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

function randomVariance(base: number, variance: number): number {
  const factor = 1 + (Math.random() * 2 - 1) * variance;
  return Math.round(base * factor * 100) / 100;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface BillingItem {
  service_name: string;
  cost: number;
  usage_date: string;
  tag_team: string | null;
  tag_environment: string;
  tag_project: string | null;
  region: string;
  usage_quantity: number;
  usage_unit: string;
}

export interface DailyAggregate {
  date: string;
  total: number;
  byService: Record<string, number>;
  byTeam: Record<string, number>;
  byEnvironment: Record<string, number>;
}

export type RecommendationStatus = 'pending' | 'accepted' | 'ignored' | 'deferred';
export type EffortLevel = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  current_cost: number;
  projected_savings: number;
  confidence: 'high' | 'medium' | 'low';
  service_name: string;
  action_type: string;
  resource_id: string;
  effort: EffortLevel;
  risk: RiskLevel;
  evidence: string[];
  status: RecommendationStatus;
}

export interface Anomaly {
  id: string;
  detectedAt: string;
  service: string;
  normalSpend: number;
  actualSpend: number;
  percentageIncrease: number;
  status: 'new' | 'acknowledged' | 'dismissed';
  description: string;
}

export interface DemoProfile {
  id: string;
  name: string;
  type: 'startup-saas' | 'ecommerce' | 'ml-heavy';
  description: string;
}

export interface ResourceUtilization {
  resourceId: string;
  resourceType: 'EC2' | 'RDS';
  instanceType: string;
  region: string;
  team: string;
  environment: string;
  cpuAvg: number;
  cpuMax: number;
  memoryAvg: number;
  memoryMax: number;
  networkAvg: number;
  storageUsed: number;
  monthlyCost: number;
  recommendation: 'downsize' | 'upsize' | 'optimal' | 'terminate';
  recommendedType: string | null;
  potentialSavings: number;
  reason: string;
}

export interface TeamBudget {
  teamName: string;
  monthlyBudget: number;
  currentSpend: number;
  previousMonthSpend: number;
  budgetOwner: string;
  alertThreshold: number;
  services: { name: string; cost: number }[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  { id: 'startup-saas', name: 'Startup SaaS', type: 'startup-saas', description: 'Lambda-heavy, moderate spend' },
  { id: 'ecommerce', name: 'E-commerce Platform', type: 'ecommerce', description: 'High S3/CloudFront, seasonal spikes' },
  { id: 'ml-heavy', name: 'ML Workload', type: 'ml-heavy', description: 'GPU instances, high compute variance' },
];

const SERVICE_WEIGHTS: Record<string, Record<string, number>> = {
  'startup-saas': { Lambda: 2.0, EC2: 0.8, S3: 1.2, RDS: 1.0, DynamoDB: 1.5, CloudFront: 0.8, EKS: 1.2, ElastiCache: 0.9 },
  'ecommerce': { Lambda: 0.8, EC2: 1.5, S3: 2.0, RDS: 1.3, DynamoDB: 0.7, CloudFront: 2.5, EKS: 1.0, ElastiCache: 1.5 },
  'ml-heavy': { Lambda: 0.5, EC2: 3.0, S3: 1.8, RDS: 0.8, DynamoDB: 0.5, CloudFront: 0.4, EKS: 2.0, ElastiCache: 0.6 },
};

export function generateBillingData(days: number = 90, profileType: DemoProfile['type'] = 'startup-saas'): BillingItem[] {
  const items: BillingItem[] = [];
  const today = new Date();
  const weights = SERVICE_WEIGHTS[profileType];
  
  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add growth trend (costs increase slightly over time)
    const trendFactor = 1 + (days - d) * 0.001;
    
    // Weekend factor (lower costs on weekends for some services)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendFactor = isWeekend ? 0.7 : 1;
    
    for (const service of SERVICES) {
      const weight = weights[service.name] || 1.0;
      // Generate 2-5 entries per service per day (different teams/envs)
      const entries = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < entries; i++) {
        const team = randomChoice(TEAMS);
        const env = randomChoice(ENVIRONMENTS);
        const region = randomChoice(REGIONS);
        
        // Environment factor (prod costs more)
        const envFactor = env === 'production' ? 2.5 : env === 'staging' ? 0.8 : 0.3;
        
        const baseCost = service.baseDaily / entries;
        const cost = randomVariance(baseCost * trendFactor * weekendFactor * envFactor * weight, service.variance);
        
        // Some items are untagged (10% chance)
        const isUntagged = Math.random() < 0.1;
        
        items.push({
          service_name: service.name,
          cost,
          usage_date: dateStr,
          tag_team: isUntagged ? null : team,
          tag_environment: env,
          tag_project: isUntagged ? null : `${team.toLowerCase()}-${env}-${service.name.toLowerCase()}`,
          region,
          usage_quantity: Math.round(cost * (10 + Math.random() * 50)),
          usage_unit: service.category === 'Compute' ? 'hours' : 
                      service.category === 'Storage' ? 'GB' : 
                      service.category === 'Networking' ? 'requests' : 'units',
        });
      }
    }
  }
  
  return items;
}

export function aggregateBillingData(items: BillingItem[]): DailyAggregate[] {
  const aggregates: Record<string, DailyAggregate> = {};
  
  for (const item of items) {
    if (!aggregates[item.usage_date]) {
      aggregates[item.usage_date] = {
        date: item.usage_date,
        total: 0,
        byService: {},
        byTeam: {},
        byEnvironment: {},
      };
    }
    
    const agg = aggregates[item.usage_date];
    agg.total += item.cost;
    agg.byService[item.service_name] = (agg.byService[item.service_name] || 0) + item.cost;
    agg.byTeam[item.tag_team || 'Unallocated'] = (agg.byTeam[item.tag_team || 'Unallocated'] || 0) + item.cost;
    agg.byEnvironment[item.tag_environment] = (agg.byEnvironment[item.tag_environment] || 0) + item.cost;
  }
  
  return Object.values(aggregates).sort((a, b) => a.date.localeCompare(b.date));
}

export function generateRecommendations(): Recommendation[] {
  return [
    {
      id: 'rec-1',
      category: 'Idle Resources',
      title: 'Terminate idle EC2 instances',
      description: 'Found 3 EC2 instances with <5% CPU utilization over the past 14 days. Consider terminating or right-sizing these instances.',
      current_cost: 892.50,
      projected_savings: 714.00,
      confidence: 'high',
      service_name: 'EC2',
      action_type: 'terminate',
      resource_id: 'i-0abc123def456789',
      effort: 'low',
      risk: 'low',
      evidence: [
        'Average CPU utilization: 4.2% over 14 days',
        'Memory usage peaked at 12%',
        'No network traffic in last 7 days',
        '3 instances affected: i-0abc123, i-0def456, i-0ghi789',
      ],
      status: 'pending',
    },
    {
      id: 'rec-2',
      category: 'Storage Optimization',
      title: 'Move infrequent S3 data to Glacier',
      description: 'Identified 2.3TB of S3 data not accessed in 90+ days. Moving to Glacier Deep Archive could save significantly.',
      current_cost: 52.90,
      projected_savings: 47.61,
      confidence: 'high',
      service_name: 'S3',
      action_type: 'storage_class',
      resource_id: 's3://company-logs-archive',
      effort: 'low',
      risk: 'low',
      evidence: [
        '2.3TB not accessed in 90+ days',
        'Last access: 120 days ago',
        'No lifecycle policies currently configured',
        'Retrieval time acceptable for archive data',
      ],
      status: 'pending',
    },
    {
      id: 'rec-3',
      category: 'Reserved Instances',
      title: 'Purchase RDS Reserved Instances',
      description: 'Your RDS usage patterns suggest 1-year reserved instances could provide substantial savings.',
      current_cost: 8400.00,
      projected_savings: 2940.00,
      confidence: 'medium',
      service_name: 'RDS',
      action_type: 'reserved',
      resource_id: 'db-prod-primary',
      effort: 'medium',
      risk: 'medium',
      evidence: [
        'RDS instances running 24/7 for 6+ months',
        'Consistent usage pattern detected',
        '35% savings with 1-year commitment',
        'Break-even at 7.5 months',
      ],
      status: 'pending',
    },
    {
      id: 'rec-4',
      category: 'Log Retention',
      title: 'Reduce CloudWatch log retention',
      description: 'Multiple log groups set to indefinite retention. Setting 30-day retention where appropriate saves storage costs.',
      current_cost: 156.00,
      projected_savings: 109.20,
      confidence: 'high',
      service_name: 'CloudWatch',
      action_type: 'retention',
      resource_id: '/aws/lambda/production-api',
      effort: 'low',
      risk: 'low',
      evidence: [
        '23 log groups with indefinite retention',
        'Only 5% of logs accessed after 7 days',
        'Compliance requires only 30-day retention',
        'Current storage: 450GB, projected: 150GB',
      ],
      status: 'pending',
    },
    {
      id: 'rec-5',
      category: 'Right-Sizing',
      title: 'Downsize over-provisioned ElastiCache',
      description: 'ElastiCache cluster showing 15% memory utilization. Consider downsizing from r6g.xlarge to r6g.large.',
      current_cost: 548.00,
      projected_savings: 274.00,
      confidence: 'medium',
      service_name: 'ElastiCache',
      action_type: 'resize',
      resource_id: 'prod-session-cache',
      effort: 'medium',
      risk: 'medium',
      evidence: [
        'Average memory utilization: 15%',
        'Peak memory: 28% during Black Friday',
        'Connection count: 45 avg, 120 max',
        'Current: r6g.xlarge, Recommended: r6g.large',
      ],
      status: 'pending',
    },
    {
      id: 'rec-6',
      category: 'Unused Resources',
      title: 'Delete unattached EBS volumes',
      description: 'Found 8 EBS volumes totaling 500GB that have been unattached for 30+ days.',
      current_cost: 50.00,
      projected_savings: 50.00,
      confidence: 'high',
      service_name: 'EBS',
      action_type: 'delete',
      resource_id: 'vol-0123456789abcdef0',
      effort: 'low',
      risk: 'low',
      evidence: [
        '8 volumes unattached for 30+ days',
        'Total size: 500GB',
        'Snapshots exist for 6 of 8 volumes',
        'No recent EC2 associations',
      ],
      status: 'pending',
    },
    {
      id: 'rec-7',
      category: 'Networking',
      title: 'Optimize NAT Gateway usage',
      description: 'High data transfer through NAT Gateway. Consider VPC endpoints for S3/DynamoDB to reduce costs.',
      current_cost: 420.00,
      projected_savings: 168.00,
      confidence: 'medium',
      service_name: 'CloudFront',
      action_type: 'optimize',
      resource_id: 'nat-0abc123def456789',
      effort: 'medium',
      risk: 'low',
      evidence: [
        '2.1TB monthly data transfer via NAT',
        '65% of traffic is to S3/DynamoDB',
        'VPC endpoints would eliminate NAT for AWS services',
        'Gateway endpoints are free for S3/DynamoDB',
      ],
      status: 'pending',
    },
    {
      id: 'rec-8',
      category: 'Development',
      title: 'Schedule dev environment shutdown',
      description: 'Development environment running 24/7. Scheduling shutdown outside business hours saves 65% of costs.',
      current_cost: 1250.00,
      projected_savings: 812.50,
      confidence: 'high',
      service_name: 'EC2',
      action_type: 'schedule',
      resource_id: 'dev-environment',
      effort: 'low',
      risk: 'low',
      evidence: [
        'Dev environment runs 24/7',
        'Zero activity 8PM-8AM and weekends',
        'Instance Scheduler can automate start/stop',
        '12 hours × 5 days = 65% reduction potential',
      ],
      status: 'pending',
    },
  ];
}

export function generateAnomalies(items: BillingItem[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const serviceDaily: Record<string, Record<string, number>> = {};

  // Group costs by service and date
  for (const item of items) {
    if (!serviceDaily[item.service_name]) {
      serviceDaily[item.service_name] = {};
    }
    serviceDaily[item.service_name][item.usage_date] = 
      (serviceDaily[item.service_name][item.usage_date] || 0) + item.cost;
  }

  // Detect anomalies (>40% above 7-day rolling average)
  for (const [service, dailyCosts] of Object.entries(serviceDaily)) {
    const dates = Object.keys(dailyCosts).sort();
    
    for (let i = 7; i < Math.min(dates.length, 30); i++) {
      const currentDate = dates[i];
      const currentCost = dailyCosts[currentDate];
      
      // Calculate 7-day rolling average
      let rollingSum = 0;
      for (let j = i - 7; j < i; j++) {
        rollingSum += dailyCosts[dates[j]];
      }
      const rollingAvg = rollingSum / 7;

      const percentageIncrease = ((currentCost - rollingAvg) / rollingAvg) * 100;

      if (percentageIncrease > 40 && currentCost > 400) {
        anomalies.push({
          id: `anomaly-${service}-${currentDate}`,
          detectedAt: currentDate,
          service,
          normalSpend: Math.round(rollingAvg * 100) / 100,
          actualSpend: Math.round(currentCost * 100) / 100,
          percentageIncrease: Math.round(percentageIncrease * 10) / 10,
          status: 'new',
          description: `Unusual spike in ${service} spend detected. Cost was ${Math.round(percentageIncrease)}% higher than the 7-day average.`,
        });
      }
    }
  }

  // Return only the most recent anomalies (up to 5)
  return anomalies.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 5);
}

export function calculateTotals(items: BillingItem[]) {
  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  
  let thisMonth = 0;
  let lastMonth = 0;
  
  for (const item of items) {
    const date = new Date(item.usage_date);
    if (date >= thisMonthStart) {
      thisMonth += item.cost;
    } else if (date >= lastMonthStart && date <= lastMonthEnd) {
      lastMonth += item.cost;
    }
  }
  
  const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  
  return {
    thisMonth: Math.round(thisMonth * 100) / 100,
    lastMonth: Math.round(lastMonth * 100) / 100,
    change: Math.round(change * 10) / 10,
  };
}

export function getServiceBreakdown(items: BillingItem[], days: number = 30, serviceFilter?: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const breakdown: Record<string, number> = {};
  
  for (const item of items) {
    if (new Date(item.usage_date) >= cutoff) {
      if (serviceFilter && serviceFilter !== 'all' && item.service_name !== serviceFilter) {
        continue;
      }
      breakdown[item.service_name] = (breakdown[item.service_name] || 0) + item.cost;
    }
  }
  
  return Object.entries(breakdown)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

export function getTeamBreakdown(items: BillingItem[], days: number = 30, serviceFilter?: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const breakdown: Record<string, number> = {};
  
  for (const item of items) {
    if (new Date(item.usage_date) >= cutoff) {
      if (serviceFilter && serviceFilter !== 'all' && item.service_name !== serviceFilter) {
        continue;
      }
      const team = item.tag_team || 'Unallocated';
      breakdown[team] = (breakdown[team] || 0) + item.cost;
    }
  }
  
  return Object.entries(breakdown)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

export function getEnvironmentBreakdown(items: BillingItem[], days: number = 30, serviceFilter?: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const breakdown: Record<string, number> = {};
  
  for (const item of items) {
    if (new Date(item.usage_date) >= cutoff) {
      if (serviceFilter && serviceFilter !== 'all' && item.service_name !== serviceFilter) {
        continue;
      }
      breakdown[item.tag_environment] = (breakdown[item.tag_environment] || 0) + item.cost;
    }
  }
  
  return Object.entries(breakdown)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

export function getDailyTrend(items: BillingItem[], days: number = 30, serviceFilter?: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const dailyTotals: Record<string, number> = {};
  
  for (const item of items) {
    if (new Date(item.usage_date) >= cutoff) {
      if (serviceFilter && serviceFilter !== 'all' && item.service_name !== serviceFilter) {
        continue;
      }
      dailyTotals[item.usage_date] = (dailyTotals[item.usage_date] || 0) + item.cost;
    }
  }
  
  return Object.entries(dailyTotals)
    .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getTopCostDrivers(items: BillingItem[], days: number = 30): { service: string; currentCost: number; previousCost: number; change: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const previousCutoff = new Date(cutoff);
  previousCutoff.setDate(previousCutoff.getDate() - days);

  const currentPeriod: Record<string, number> = {};
  const previousPeriod: Record<string, number> = {};

  for (const item of items) {
    const date = new Date(item.usage_date);
    if (date >= cutoff) {
      currentPeriod[item.service_name] = (currentPeriod[item.service_name] || 0) + item.cost;
    } else if (date >= previousCutoff && date < cutoff) {
      previousPeriod[item.service_name] = (previousPeriod[item.service_name] || 0) + item.cost;
    }
  }

  const services = new Set([...Object.keys(currentPeriod), ...Object.keys(previousPeriod)]);
  
  return Array.from(services)
    .map((service) => {
      const currentCost = currentPeriod[service] || 0;
      const previousCost = previousPeriod[service] || 0;
      const change = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;
      return {
        service,
        currentCost: Math.round(currentCost * 100) / 100,
        previousCost: Math.round(previousCost * 100) / 100,
        change: Math.round(change * 10) / 10,
      };
    })
    .sort((a, b) => b.currentCost - a.currentCost);
}

export function getUnallocatedSpend(items: BillingItem[], days: number = 30): { amount: number; total: number } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  let unallocated = 0;
  let total = 0;

  for (const item of items) {
    if (new Date(item.usage_date) >= cutoff) {
      total += item.cost;
      if (!item.tag_team && !item.tag_project) {
        unallocated += item.cost;
      }
    }
  }

  return {
    amount: Math.round(unallocated * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function getCostUnitMetrics(items: BillingItem[], days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  let totalCost = 0;
  let totalRequests = 0;

  for (const item of items) {
    if (new Date(item.usage_date) >= cutoff) {
      totalCost += item.cost;
      if (item.usage_unit === 'requests') {
        totalRequests += item.usage_quantity;
      }
    }
  }

  // Mock active users based on cost patterns
  const estimatedUsers = Math.floor(totalCost / 15);
  const costPerUser = estimatedUsers > 0 ? totalCost / estimatedUsers : 0;
  const costPerRequest = totalRequests > 0 ? (totalCost / totalRequests) * 1000 : 0;

  return [
    {
      label: 'Cost per User',
      value: Math.round(costPerUser * 100) / 100,
      unit: 'per active user/month',
      icon: 'users' as const,
      trend: -3.2,
    },
    {
      label: 'Cost per 1K Requests',
      value: Math.round(costPerRequest * 100) / 100,
      unit: 'per 1,000 API calls',
      icon: 'requests' as const,
      trend: 1.5,
    },
    {
      label: 'Storage Cost Ratio',
      value: 0.18,
      unit: 'per GB stored/month',
      icon: 'storage' as const,
      trend: -8.4,
    },
  ];
}

// Resource utilization generator for rightsizing
const EC2_INSTANCE_TYPES = ['t3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge', 'm6i.large', 'm6i.xlarge', 'm6i.2xlarge', 'c6i.large', 'c6i.xlarge', 'r6i.large', 'r6i.xlarge'];
const RDS_INSTANCE_TYPES = ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.t3.large', 'db.m6g.large', 'db.m6g.xlarge', 'db.r6g.large', 'db.r6g.xlarge'];

const INSTANCE_COSTS: Record<string, number> = {
  't3.micro': 7.59, 't3.small': 15.18, 't3.medium': 30.37, 't3.large': 60.74, 't3.xlarge': 121.47,
  'm6i.large': 70.08, 'm6i.xlarge': 140.16, 'm6i.2xlarge': 280.32,
  'c6i.large': 62.05, 'c6i.xlarge': 124.10,
  'r6i.large': 91.98, 'r6i.xlarge': 183.96,
  'db.t3.micro': 12.41, 'db.t3.small': 24.82, 'db.t3.medium': 49.64, 'db.t3.large': 99.28,
  'db.m6g.large': 112.42, 'db.m6g.xlarge': 224.84,
  'db.r6g.large': 140.16, 'db.r6g.xlarge': 280.32,
};

function getSmallerInstance(type: string): string | null {
  const ec2Order = EC2_INSTANCE_TYPES;
  const rdsOrder = RDS_INSTANCE_TYPES;
  const list = type.startsWith('db.') ? rdsOrder : ec2Order;
  const idx = list.indexOf(type);
  return idx > 0 ? list[idx - 1] : null;
}

export function generateResourceUtilization(profileType: DemoProfile['type'] = 'startup-saas'): ResourceUtilization[] {
  const resources: ResourceUtilization[] = [];
  
  // Generate EC2 instances
  const ec2Count = profileType === 'ml-heavy' ? 18 : profileType === 'ecommerce' ? 14 : 10;
  for (let i = 0; i < ec2Count; i++) {
    const instanceType = randomChoice(EC2_INSTANCE_TYPES);
    const team = randomChoice(TEAMS);
    const env = randomChoice(ENVIRONMENTS);
    const region = randomChoice(REGIONS);
    
    // Generate utilization - mix of optimal, under-utilized, and over-utilized
    const utilizationProfile = Math.random();
    let cpuAvg: number, cpuMax: number, memoryAvg: number, memoryMax: number;
    
    if (utilizationProfile < 0.15) {
      // Idle (terminate candidate)
      cpuAvg = Math.round(Math.random() * 3);
      cpuMax = Math.round(Math.random() * 8);
      memoryAvg = Math.round(Math.random() * 5);
      memoryMax = Math.round(Math.random() * 12);
    } else if (utilizationProfile < 0.4) {
      // Under-utilized (downsize candidate)
      cpuAvg = Math.round(10 + Math.random() * 20);
      cpuMax = Math.round(30 + Math.random() * 25);
      memoryAvg = Math.round(15 + Math.random() * 25);
      memoryMax = Math.round(35 + Math.random() * 20);
    } else if (utilizationProfile < 0.85) {
      // Optimal
      cpuAvg = Math.round(40 + Math.random() * 30);
      cpuMax = Math.round(60 + Math.random() * 20);
      memoryAvg = Math.round(45 + Math.random() * 25);
      memoryMax = Math.round(65 + Math.random() * 20);
    } else {
      // Over-utilized (upsize candidate)
      cpuAvg = Math.round(70 + Math.random() * 20);
      cpuMax = Math.round(85 + Math.random() * 15);
      memoryAvg = Math.round(75 + Math.random() * 15);
      memoryMax = Math.round(88 + Math.random() * 12);
    }

    const monthlyCost = INSTANCE_COSTS[instanceType] || 50;
    let recommendation: ResourceUtilization['recommendation'] = 'optimal';
    let recommendedType: string | null = null;
    let potentialSavings = 0;
    let reason = 'Instance is appropriately sized';

    if (cpuAvg < 3 && memoryAvg < 5) {
      recommendation = 'terminate';
      potentialSavings = monthlyCost;
      reason = `Instance appears idle (CPU: ${cpuAvg}%, Memory: ${memoryAvg}%)`;
    } else if (cpuAvg < 30 && memoryAvg < 40 && cpuMax < 60) {
      recommendation = 'downsize';
      recommendedType = getSmallerInstance(instanceType);
      if (recommendedType) {
        potentialSavings = monthlyCost - (INSTANCE_COSTS[recommendedType] || monthlyCost * 0.5);
      }
      reason = `Low utilization (CPU: ${cpuAvg}%, Memory: ${memoryAvg}%)`;
    } else if (cpuMax > 85 || memoryMax > 90) {
      recommendation = 'upsize';
      reason = `High utilization (CPU max: ${cpuMax}%, Memory max: ${memoryMax}%)`;
    }

    resources.push({
      resourceId: `i-${Math.random().toString(36).substr(2, 12)}`,
      resourceType: 'EC2',
      instanceType,
      region,
      team,
      environment: env,
      cpuAvg,
      cpuMax,
      memoryAvg,
      memoryMax,
      networkAvg: Math.round(Math.random() * 100),
      storageUsed: Math.round(Math.random() * 500),
      monthlyCost,
      recommendation,
      recommendedType,
      potentialSavings,
      reason,
    });
  }

  // Generate RDS instances
  const rdsCount = profileType === 'ml-heavy' ? 4 : profileType === 'ecommerce' ? 6 : 4;
  for (let i = 0; i < rdsCount; i++) {
    const instanceType = randomChoice(RDS_INSTANCE_TYPES);
    const team = randomChoice(TEAMS);
    const env = randomChoice(ENVIRONMENTS);
    const region = randomChoice(REGIONS);
    
    const utilizationProfile = Math.random();
    let cpuAvg: number, cpuMax: number, memoryAvg: number, memoryMax: number;
    
    if (utilizationProfile < 0.3) {
      cpuAvg = Math.round(10 + Math.random() * 15);
      cpuMax = Math.round(25 + Math.random() * 20);
      memoryAvg = Math.round(20 + Math.random() * 20);
      memoryMax = Math.round(40 + Math.random() * 15);
    } else if (utilizationProfile < 0.85) {
      cpuAvg = Math.round(35 + Math.random() * 30);
      cpuMax = Math.round(55 + Math.random() * 25);
      memoryAvg = Math.round(50 + Math.random() * 25);
      memoryMax = Math.round(70 + Math.random() * 15);
    } else {
      cpuAvg = Math.round(65 + Math.random() * 25);
      cpuMax = Math.round(80 + Math.random() * 20);
      memoryAvg = Math.round(70 + Math.random() * 20);
      memoryMax = Math.round(85 + Math.random() * 15);
    }

    const monthlyCost = INSTANCE_COSTS[instanceType] || 100;
    let recommendation: ResourceUtilization['recommendation'] = 'optimal';
    let recommendedType: string | null = null;
    let potentialSavings = 0;
    let reason = 'Instance is appropriately sized';

    if (cpuAvg < 25 && memoryAvg < 35 && cpuMax < 50) {
      recommendation = 'downsize';
      recommendedType = getSmallerInstance(instanceType);
      if (recommendedType) {
        potentialSavings = monthlyCost - (INSTANCE_COSTS[recommendedType] || monthlyCost * 0.5);
      }
      reason = `Low utilization (CPU: ${cpuAvg}%, Memory: ${memoryAvg}%)`;
    } else if (cpuMax > 85 || memoryMax > 90) {
      recommendation = 'upsize';
      reason = `High utilization (CPU max: ${cpuMax}%, Memory max: ${memoryMax}%)`;
    }

    resources.push({
      resourceId: `db-${Math.random().toString(36).substr(2, 10)}`,
      resourceType: 'RDS',
      instanceType,
      region,
      team,
      environment: env,
      cpuAvg,
      cpuMax,
      memoryAvg,
      memoryMax,
      networkAvg: Math.round(Math.random() * 50),
      storageUsed: Math.round(100 + Math.random() * 400),
      monthlyCost,
      recommendation,
      recommendedType,
      potentialSavings,
      reason,
    });
  }

  return resources;
}

// Team budget generator
export function generateTeamBudgets(items: BillingItem[], days: number = 30): TeamBudget[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const previousCutoff = new Date(cutoff);
  previousCutoff.setDate(previousCutoff.getDate() - days);

  // Calculate actual spend per team
  const teamSpend: Record<string, { current: number; previous: number; services: Record<string, number> }> = {};
  
  for (const item of items) {
    const team = item.tag_team || 'Unallocated';
    if (!teamSpend[team]) {
      teamSpend[team] = { current: 0, previous: 0, services: {} };
    }
    
    const date = new Date(item.usage_date);
    if (date >= cutoff) {
      teamSpend[team].current += item.cost;
      teamSpend[team].services[item.service_name] = (teamSpend[team].services[item.service_name] || 0) + item.cost;
    } else if (date >= previousCutoff && date < cutoff) {
      teamSpend[team].previous += item.cost;
    }
  }

  // Budget allocations per team (varied by team)
  const budgetMultipliers: Record<string, number> = {
    'Engineering': 1.1,
    'Data': 0.95,
    'Platform': 1.05,
    'DevOps': 1.2,
    'ML': 0.85,
    'Unallocated': 1.5,
  };

  const ownerEmails: Record<string, string> = {
    'Engineering': 'eng-lead@company.com',
    'Data': 'data-lead@company.com',
    'Platform': 'platform-lead@company.com',
    'DevOps': 'devops-lead@company.com',
    'ML': 'ml-lead@company.com',
    'Unallocated': 'finance@company.com',
  };

  return Object.entries(teamSpend)
    .filter(([team]) => team !== 'Unallocated')
    .map(([teamName, data]) => {
      const multiplier = budgetMultipliers[teamName] || 1;
      const monthlyBudget = Math.round(data.current * multiplier / 100) * 100;
      const services = Object.entries(data.services)
        .map(([name, cost]) => ({ name, cost: Math.round(cost * 100) / 100 }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5);

      return {
        teamName,
        monthlyBudget,
        currentSpend: Math.round(data.current * 100) / 100,
        previousMonthSpend: Math.round(data.previous * 100) / 100,
        budgetOwner: ownerEmails[teamName] || `${teamName.toLowerCase()}@company.com`,
        alertThreshold: 80,
        services,
      };
    })
    .sort((a, b) => b.currentSpend - a.currentSpend);
}
