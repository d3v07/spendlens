/**
 * Spending anomaly detector for SpendLens.
 *
 * Uses a simple z-score algorithm over the trailing N days to flag
 * individual days whose spend deviates significantly from the mean.
 * Works on any numeric time-series (daily totals, per-service costs, etc.).
 */

export interface DailySpend {
  date: string;   // YYYY-MM-DD
  amount: number;
}

export interface AnomalyResult {
  date: string;
  amount: number;
  mean: number;
  stddev: number;
  zScore: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Detect anomalous spend days using z-score on a rolling window.
 *
 * @param series        Chronologically ordered daily spend data.
 * @param windowSize    Number of preceding days used to compute baseline (default 14).
 * @param threshold     Z-score magnitude above which a day is flagged (default 2.0).
 */
export function detectAnomalies(
  series: DailySpend[],
  windowSize = 14,
  threshold = 2.0
): AnomalyResult[] {
  return series.map((point, index) => {
    const windowStart = Math.max(0, index - windowSize);
    const window = series.slice(windowStart, index).map((d) => d.amount);

    const avg = mean(window);
    const sd = stddev(window, avg);
    const zScore = sd === 0 ? 0 : (point.amount - avg) / sd;
    const absZ = Math.abs(zScore);
    const isAnomaly = absZ >= threshold && window.length >= 3;

    let severity: AnomalyResult['severity'] = 'low';
    if (absZ >= threshold * 2) severity = 'high';
    else if (absZ >= threshold * 1.5) severity = 'medium';

    return {
      date: point.date,
      amount: point.amount,
      mean: avg,
      stddev: sd,
      zScore,
      isAnomaly,
      severity,
    };
  });
}

/** Filter results to only the flagged anomaly days. */
export function filterAnomalies(results: AnomalyResult[]): AnomalyResult[] {
  return results.filter((r) => r.isAnomaly);
}
