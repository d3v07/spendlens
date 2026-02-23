import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, HardDrive } from "lucide-react";

interface CostUnitMetric {
  label: string;
  value: number;
  unit: string;
  icon: "users" | "requests" | "storage";
  trend?: number;
}

interface CostUnitMetricsProps {
  metrics: CostUnitMetric[];
}

const IconMap = {
  users: Users,
  requests: Zap,
  storage: HardDrive,
};

export function CostUnitMetrics({ metrics }: CostUnitMetricsProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Unit Economics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = IconMap[metric.icon];
            return (
              <div key={metric.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="text-xs text-muted-foreground">{metric.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatValue(metric.value)}</p>
                  {metric.trend !== undefined && (
                    <p className={`text-xs ${metric.trend > 0 ? "text-destructive" : "text-success"}`}>
                      {metric.trend > 0 ? "+" : ""}{metric.trend.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
