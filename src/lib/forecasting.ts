// Simple linear regression for trend analysis
interface DataPoint {
  date: string;
  value: number;
}

interface ForecastResult {
  date: string;
  actual?: number;
  forecast: number;
  upperBound: number;
  lowerBound: number;
  isProjection: boolean;
}

interface TrendAnalysis {
  slope: number;
  intercept: number;
  rSquared: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  averageDaily: number;
  volatility: number;
}

// Calculate linear regression
function linearRegression(data: DataPoint[]): { slope: number; intercept: number; rSquared: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.value || 0, rSquared: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  data.forEach((point, i) => {
    const x = i;
    const y = point.value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let ssRes = 0;
  let ssTot = 0;
  
  data.forEach((point, i) => {
    const predicted = intercept + slope * i;
    ssRes += Math.pow(point.value - predicted, 2);
    ssTot += Math.pow(point.value - meanY, 2);
  });

  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

// Calculate standard deviation for confidence intervals
function calculateStdDev(data: DataPoint[], regression: { slope: number; intercept: number }): number {
  const n = data.length;
  if (n < 3) return 0;

  const residuals = data.map((point, i) => {
    const predicted = regression.intercept + regression.slope * i;
    return point.value - predicted;
  });

  const meanResidual = residuals.reduce((a, b) => a + b, 0) / n;
  const variance = residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / (n - 2);
  
  return Math.sqrt(variance);
}

// Analyze trend from historical data
export function analyzeTrend(data: DataPoint[]): TrendAnalysis {
  const regression = linearRegression(data);
  const averageDaily = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  
  // Calculate volatility (coefficient of variation)
  const stdDev = Math.sqrt(
    data.reduce((sum, d) => sum + Math.pow(d.value - averageDaily, 2), 0) / data.length
  );
  const volatility = averageDaily > 0 ? (stdDev / averageDaily) * 100 : 0;

  // Determine trend direction
  let trend: 'increasing' | 'decreasing' | 'stable';
  const slopeAsPercentOfAvg = averageDaily > 0 ? (regression.slope / averageDaily) * 100 : 0;
  
  if (slopeAsPercentOfAvg > 1) {
    trend = 'increasing';
  } else if (slopeAsPercentOfAvg < -1) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  return {
    slope: regression.slope,
    intercept: regression.intercept,
    rSquared: regression.rSquared,
    trend,
    averageDaily,
    volatility,
  };
}

// Generate forecast with confidence intervals
export function generateForecast(
  historicalData: DataPoint[],
  forecastDays: number = 30,
  confidenceLevel: number = 0.95
): ForecastResult[] {
  const regression = linearRegression(historicalData);
  const stdDev = calculateStdDev(historicalData, regression);
  
  // Z-score for confidence level (1.96 for 95%)
  const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.90 ? 1.645 : 1.28;
  
  const results: ForecastResult[] = [];
  
  // Add historical data with fitted values
  historicalData.forEach((point, i) => {
    const forecast = Math.max(0, regression.intercept + regression.slope * i);
    results.push({
      date: point.date,
      actual: point.value,
      forecast,
      upperBound: forecast + zScore * stdDev,
      lowerBound: Math.max(0, forecast - zScore * stdDev),
      isProjection: false,
    });
  });

  // Generate future projections
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastIndex = historicalData.length - 1;

  for (let i = 1; i <= forecastDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const forecastIndex = lastIndex + i;
    const forecast = Math.max(0, regression.intercept + regression.slope * forecastIndex);
    
    // Widen confidence interval for further projections
    const widthMultiplier = 1 + (i / forecastDays) * 0.5;
    const intervalWidth = zScore * stdDev * widthMultiplier;
    
    results.push({
      date: futureDate.toISOString().split('T')[0],
      forecast,
      upperBound: forecast + intervalWidth,
      lowerBound: Math.max(0, forecast - intervalWidth),
      isProjection: true,
    });
  }

  return results;
}

// Calculate projected monthly totals
export function projectMonthlyTotals(
  dailyForecast: ForecastResult[],
  months: number = 3
): { month: string; projected: number; upper: number; lower: number }[] {
  const projections = dailyForecast.filter(d => d.isProjection);
  const results: { month: string; projected: number; upper: number; lower: number }[] = [];
  
  // Group by month
  const monthlyData = new Map<string, { projected: number; upper: number; lower: number }>();
  
  projections.forEach(day => {
    const monthKey = day.date.substring(0, 7); // YYYY-MM
    const existing = monthlyData.get(monthKey) || { projected: 0, upper: 0, lower: 0 };
    monthlyData.set(monthKey, {
      projected: existing.projected + day.forecast,
      upper: existing.upper + day.upperBound,
      lower: existing.lower + day.lowerBound,
    });
  });

  monthlyData.forEach((data, month) => {
    results.push({ month, ...data });
  });

  return results.slice(0, months);
}

// Calculate cost savings scenarios
export function calculateSavingsScenario(
  currentMonthly: number,
  reductionPercent: number,
  months: number = 12
): { month: number; baseline: number; optimized: number; savings: number }[] {
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    baseline: currentMonthly,
    optimized: currentMonthly * (1 - reductionPercent / 100),
    savings: currentMonthly * (reductionPercent / 100) * (i + 1),
  }));
}
