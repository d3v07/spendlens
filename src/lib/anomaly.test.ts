import { describe, test, expect } from 'vitest';
import { detectAnomalies, filterAnomalies } from './anomaly';

function makeSeries(values: number[]) {
  return values.map((amount, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    amount,
  }));
}

describe('detectAnomalies', () => {
  test('returns same length array as input', () => {
    const series = makeSeries([100, 110, 105, 108, 102]);
    expect(detectAnomalies(series)).toHaveLength(5);
  });

  test('does not flag normal variation', () => {
    const series = makeSeries([100, 102, 98, 101, 103, 99, 100, 101]);
    const results = filterAnomalies(detectAnomalies(series));
    expect(results).toHaveLength(0);
  });

  test('flags obvious spike', () => {
    const normal = [98, 102, 100, 99, 101, 100, 103, 97, 100, 101,
                    99, 100, 102, 98, 100, 101, 99, 100, 102, 100];
    const withSpike = [...normal, 500];
    const series = makeSeries(withSpike);
    const anomalies = filterAnomalies(detectAnomalies(series));
    // The spike at 500 must appear among the flagged anomalies
    expect(anomalies.some((a) => a.amount === 500)).toBe(true);
  });

  test('assigns high severity to extreme spike', () => {
    // Use slightly varying baseline so stddev > 0
    const normal = [98, 102, 100, 99, 101, 100, 103, 97, 100, 101,
                    99, 100, 102, 98, 100, 101, 99, 100, 102, 100];
    const series = makeSeries([...normal, 1000]);
    const results = detectAnomalies(series);
    const last = results[results.length - 1];
    expect(last.isAnomaly).toBe(true);
    expect(last.severity).toBe('high');
  });

  test('does not flag first few points with insufficient window', () => {
    const series = makeSeries([50, 200, 1000]); // window < 3
    const anomalies = filterAnomalies(detectAnomalies(series));
    expect(anomalies).toHaveLength(0);
  });

  test('z-score is 0 for flat series', () => {
    const series = makeSeries(Array(15).fill(100));
    const results = detectAnomalies(series);
    results.slice(14).forEach((r) => expect(r.zScore).toBe(0));
  });
});
