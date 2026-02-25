import { describe, test, expect } from 'vitest';
import { generateBudgetReport, type BillingItem } from './budget-report';

const items: BillingItem[] = [
  { date: '2024-01-01', service: 'EC2',    team: 'Engineering', environment: 'production', region: 'us-east-1', amount: 500,  currency: 'USD' },
  { date: '2024-01-02', service: 'S3',     team: 'Data',        environment: 'production', region: 'us-east-1', amount: 50,   currency: 'USD' },
  { date: '2024-01-03', service: 'RDS',    team: 'Engineering', environment: 'staging',    region: 'us-east-1', amount: 200,  currency: 'USD' },
  { date: '2024-01-04', service: 'EC2',    team: 'Platform',    environment: 'production', region: 'us-west-2', amount: 300,  currency: 'USD' },
  { date: '2024-01-05', service: 'Lambda', team: 'Data',        environment: 'production', region: 'us-east-1', amount: 10,   currency: 'USD' },
];

describe('generateBudgetReport', () => {
  test('computes correct total spend', () => {
    const report = generateBudgetReport(items);
    expect(report.totalSpend).toBe(1060);
  });

  test('returns empty report for empty input', () => {
    const report = generateBudgetReport([]);
    expect(report.totalSpend).toBe(0);
    expect(report.byService).toHaveLength(0);
    expect(report.topSpender).toBe('N/A');
  });

  test('identifies top spender as highest-cost service', () => {
    const report = generateBudgetReport(items);
    expect(report.topSpender).toBe('EC2'); // 500+300 = 800
  });

  test('byService totals sum to overall total', () => {
    const report = generateBudgetReport(items);
    const serviceTotal = report.byService.reduce((s, b) => s + b.total, 0);
    expect(serviceTotal).toBeCloseTo(report.totalSpend, 1);
  });

  test('percentages sum to ~100%', () => {
    const report = generateBudgetReport(items);
    const pctSum = report.byService.reduce((s, b) => s + b.percentage, 0);
    expect(pctSum).toBeCloseTo(100, 0);
  });

  test('byService is sorted descending by total', () => {
    const report = generateBudgetReport(items);
    for (let i = 1; i < report.byService.length; i++) {
      expect(report.byService[i - 1].total).toBeGreaterThanOrEqual(report.byService[i].total);
    }
  });

  test('period start and end match item date range', () => {
    const report = generateBudgetReport(items);
    expect(report.periodStart).toBe('2024-01-01');
    expect(report.periodEnd).toBe('2024-01-05');
  });

  test('computes correct daily average', () => {
    const report = generateBudgetReport(items);
    expect(report.dailyAverage).toBe(212); // 1060 / 5 days
  });
});
