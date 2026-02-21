// EC2 and RDS instance type definitions with pricing and specs

export interface InstanceSpec {
  vCPU: number;
  memory: number; // GB
  hourlyRate: number;
  monthlyRate: number;
  category: 'general' | 'compute' | 'memory' | 'storage';
}

export const EC2_INSTANCES: Record<string, InstanceSpec> = {
  // T3 - Burstable (General purpose)
  't3.micro': { vCPU: 2, memory: 1, hourlyRate: 0.0104, monthlyRate: 7.59, category: 'general' },
  't3.small': { vCPU: 2, memory: 2, hourlyRate: 0.0208, monthlyRate: 15.18, category: 'general' },
  't3.medium': { vCPU: 2, memory: 4, hourlyRate: 0.0416, monthlyRate: 30.37, category: 'general' },
  't3.large': { vCPU: 2, memory: 8, hourlyRate: 0.0832, monthlyRate: 60.74, category: 'general' },
  't3.xlarge': { vCPU: 4, memory: 16, hourlyRate: 0.1664, monthlyRate: 121.47, category: 'general' },
  't3.2xlarge': { vCPU: 8, memory: 32, hourlyRate: 0.3328, monthlyRate: 242.94, category: 'general' },
  
  // M6i - General purpose
  'm6i.large': { vCPU: 2, memory: 8, hourlyRate: 0.096, monthlyRate: 70.08, category: 'general' },
  'm6i.xlarge': { vCPU: 4, memory: 16, hourlyRate: 0.192, monthlyRate: 140.16, category: 'general' },
  'm6i.2xlarge': { vCPU: 8, memory: 32, hourlyRate: 0.384, monthlyRate: 280.32, category: 'general' },
  'm6i.4xlarge': { vCPU: 16, memory: 64, hourlyRate: 0.768, monthlyRate: 560.64, category: 'general' },
  'm6i.8xlarge': { vCPU: 32, memory: 128, hourlyRate: 1.536, monthlyRate: 1121.28, category: 'general' },
  
  // C6i - Compute optimized
  'c6i.large': { vCPU: 2, memory: 4, hourlyRate: 0.085, monthlyRate: 62.05, category: 'compute' },
  'c6i.xlarge': { vCPU: 4, memory: 8, hourlyRate: 0.170, monthlyRate: 124.10, category: 'compute' },
  'c6i.2xlarge': { vCPU: 8, memory: 16, hourlyRate: 0.340, monthlyRate: 248.20, category: 'compute' },
  'c6i.4xlarge': { vCPU: 16, memory: 32, hourlyRate: 0.680, monthlyRate: 496.40, category: 'compute' },
  
  // R6i - Memory optimized
  'r6i.large': { vCPU: 2, memory: 16, hourlyRate: 0.126, monthlyRate: 91.98, category: 'memory' },
  'r6i.xlarge': { vCPU: 4, memory: 32, hourlyRate: 0.252, monthlyRate: 183.96, category: 'memory' },
  'r6i.2xlarge': { vCPU: 8, memory: 64, hourlyRate: 0.504, monthlyRate: 367.92, category: 'memory' },
  'r6i.4xlarge': { vCPU: 16, memory: 128, hourlyRate: 1.008, monthlyRate: 735.84, category: 'memory' },
};

export const RDS_INSTANCES: Record<string, InstanceSpec> = {
  'db.t3.micro': { vCPU: 2, memory: 1, hourlyRate: 0.017, monthlyRate: 12.41, category: 'general' },
  'db.t3.small': { vCPU: 2, memory: 2, hourlyRate: 0.034, monthlyRate: 24.82, category: 'general' },
  'db.t3.medium': { vCPU: 2, memory: 4, hourlyRate: 0.068, monthlyRate: 49.64, category: 'general' },
  'db.t3.large': { vCPU: 2, memory: 8, hourlyRate: 0.136, monthlyRate: 99.28, category: 'general' },
  
  'db.m6g.large': { vCPU: 2, memory: 8, hourlyRate: 0.154, monthlyRate: 112.42, category: 'general' },
  'db.m6g.xlarge': { vCPU: 4, memory: 16, hourlyRate: 0.308, monthlyRate: 224.84, category: 'general' },
  'db.m6g.2xlarge': { vCPU: 8, memory: 32, hourlyRate: 0.616, monthlyRate: 449.68, category: 'general' },
  'db.m6g.4xlarge': { vCPU: 16, memory: 64, hourlyRate: 1.232, monthlyRate: 899.36, category: 'general' },
  
  'db.r6g.large': { vCPU: 2, memory: 16, hourlyRate: 0.192, monthlyRate: 140.16, category: 'memory' },
  'db.r6g.xlarge': { vCPU: 4, memory: 32, hourlyRate: 0.384, monthlyRate: 280.32, category: 'memory' },
  'db.r6g.2xlarge': { vCPU: 8, memory: 64, hourlyRate: 0.768, monthlyRate: 560.64, category: 'memory' },
  'db.r6g.4xlarge': { vCPU: 16, memory: 128, hourlyRate: 1.536, monthlyRate: 1121.28, category: 'memory' },
};

export type RightsizingRecommendation = 'downsize' | 'upsize' | 'optimal' | 'terminate';

export interface RightsizingResult {
  recommendation: RightsizingRecommendation;
  currentType: string;
  suggestedType: string | null;
  currentCost: number;
  projectedCost: number;
  savings: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function getSmallerInstance(instanceType: string, isRDS: boolean = false): string | null {
  const instances = isRDS ? RDS_INSTANCES : EC2_INSTANCES;
  const instanceList = Object.entries(instances).sort((a, b) => a[1].monthlyRate - b[1].monthlyRate);
  const currentIndex = instanceList.findIndex(([type]) => type === instanceType);
  
  if (currentIndex <= 0) return null;
  
  // Find a smaller instance in the same family if possible
  const currentFamily = instanceType.split('.')[0];
  for (let i = currentIndex - 1; i >= 0; i--) {
    const [type] = instanceList[i];
    if (type.startsWith(currentFamily)) return type;
  }
  
  // Otherwise return next smaller
  return instanceList[currentIndex - 1]?.[0] || null;
}

export function getLargerInstance(instanceType: string, isRDS: boolean = false): string | null {
  const instances = isRDS ? RDS_INSTANCES : EC2_INSTANCES;
  const instanceList = Object.entries(instances).sort((a, b) => a[1].monthlyRate - b[1].monthlyRate);
  const currentIndex = instanceList.findIndex(([type]) => type === instanceType);
  
  if (currentIndex < 0 || currentIndex >= instanceList.length - 1) return null;
  
  // Find a larger instance in the same family if possible
  const currentFamily = instanceType.split('.')[0];
  for (let i = currentIndex + 1; i < instanceList.length; i++) {
    const [type] = instanceList[i];
    if (type.startsWith(currentFamily)) return type;
  }
  
  // Otherwise return next larger
  return instanceList[currentIndex + 1]?.[0] || null;
}

export function analyzeRightsizing(
  instanceType: string,
  cpuAvg: number,
  cpuMax: number,
  memoryAvg: number,
  memoryMax: number,
  isRDS: boolean = false
): RightsizingResult {
  const instances = isRDS ? RDS_INSTANCES : EC2_INSTANCES;
  const currentSpec = instances[instanceType];
  
  if (!currentSpec) {
    return {
      recommendation: 'optimal',
      currentType: instanceType,
      suggestedType: null,
      currentCost: 0,
      projectedCost: 0,
      savings: 0,
      confidence: 'low',
      reason: 'Unknown instance type',
    };
  }

  // Terminate if extremely low utilization
  if (cpuAvg < 2 && memoryAvg < 5 && cpuMax < 10) {
    return {
      recommendation: 'terminate',
      currentType: instanceType,
      suggestedType: null,
      currentCost: currentSpec.monthlyRate,
      projectedCost: 0,
      savings: currentSpec.monthlyRate,
      confidence: 'high',
      reason: 'Instance appears to be idle (CPU < 2%, Memory < 5%)',
    };
  }

  // Downsize if avg utilization is low
  if (cpuAvg < 30 && memoryAvg < 40 && cpuMax < 60) {
    const smallerInstance = getSmallerInstance(instanceType, isRDS);
    if (smallerInstance) {
      const smallerSpec = instances[smallerInstance];
      return {
        recommendation: 'downsize',
        currentType: instanceType,
        suggestedType: smallerInstance,
        currentCost: currentSpec.monthlyRate,
        projectedCost: smallerSpec.monthlyRate,
        savings: currentSpec.monthlyRate - smallerSpec.monthlyRate,
        confidence: cpuAvg < 15 ? 'high' : 'medium',
        reason: `Low utilization (CPU: ${cpuAvg}%, Memory: ${memoryAvg}%)`,
      };
    }
  }

  // Upsize if utilization is high
  if (cpuMax > 85 || memoryMax > 90) {
    const largerInstance = getLargerInstance(instanceType, isRDS);
    if (largerInstance) {
      const largerSpec = instances[largerInstance];
      return {
        recommendation: 'upsize',
        currentType: instanceType,
        suggestedType: largerInstance,
        currentCost: currentSpec.monthlyRate,
        projectedCost: largerSpec.monthlyRate,
        savings: currentSpec.monthlyRate - largerSpec.monthlyRate, // Negative = cost increase
        confidence: cpuMax > 95 || memoryMax > 95 ? 'high' : 'medium',
        reason: `High utilization (CPU max: ${cpuMax}%, Memory max: ${memoryMax}%)`,
      };
    }
  }

  // Optimal
  return {
    recommendation: 'optimal',
    currentType: instanceType,
    suggestedType: null,
    currentCost: currentSpec.monthlyRate,
    projectedCost: currentSpec.monthlyRate,
    savings: 0,
    confidence: 'high',
    reason: 'Instance is appropriately sized',
  };
}
