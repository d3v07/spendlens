/**
 * Budget report generator for SpendLens.
 *
 * Aggregates raw billing line items into a structured report covering
 * spend-by-service, spend-by-team, and spend-by-environment breakdowns.
 * The output can be rendered in the UI or exported via the CSV utility.
 */

export interface BillingItem {
  date:        string;
  service:     string;
  team:        string;
  environment: string;
  region:      string;
  amount:      number;
  currency:    string;
}

export interface CategoryBreakdown {
  name:       string;
  total:      number;
  percentage: number;
  itemCount:  number;
}

export interface BudgetReport {
  generatedAt:    string;
  totalSpend:     number;
  currency:       string;
  periodStart:    string;
  periodEnd:      string;
  byService:      CategoryBreakdown[];
  byTeam:         CategoryBreakdown[];
  byEnvironment:  CategoryBreakdown[];
  dailyAverage:   number;
  topSpender:     string;  // highest-cost service
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

function toBreakdown(
  grouped: Map<string, BillingItem[]>,
  total: number
): CategoryBreakdown[] {
  return Array.from(grouped.entries())
    .map(([name, items]) => {
      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      return {
        name,
        total:      Math.round(subtotal * 100) / 100,
        percentage: total > 0 ? Math.round((subtotal / total) * 10000) / 100 : 0,
        itemCount:  items.length,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function generateBudgetReport(items: BillingItem[]): BudgetReport {
  if (items.length === 0) {
    const now = new Date().toISOString();
    return {
      generatedAt: now, totalSpend: 0, currency: 'USD',
      periodStart: now, periodEnd: now,
      byService: [], byTeam: [], byEnvironment: [],
      dailyAverage: 0, topSpender: 'N/A',
    };
  }

  const dates    = items.map((i) => i.date).sort();
  const total    = items.reduce((s, i) => s + i.amount, 0);
  const currency = items[0].currency;

  const byService     = toBreakdown(groupBy(items, (i) => i.service),     total);
  const byTeam        = toBreakdown(groupBy(items, (i) => i.team),        total);
  const byEnvironment = toBreakdown(groupBy(items, (i) => i.environment), total);

  const uniqueDays = new Set(dates).size;
  const dailyAverage = uniqueDays > 0 ? total / uniqueDays : 0;

  return {
    generatedAt:   new Date().toISOString(),
    totalSpend:    Math.round(total * 100) / 100,
    currency,
    periodStart:   dates[0],
    periodEnd:     dates[dates.length - 1],
    byService,
    byTeam,
    byEnvironment,
    dailyAverage:  Math.round(dailyAverage * 100) / 100,
    topSpender:    byService[0]?.name ?? 'N/A',
  };
}
