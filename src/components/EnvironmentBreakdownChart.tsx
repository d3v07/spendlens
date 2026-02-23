import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EnvironmentBreakdownChartProps {
  data: { name: string; value: number }[];
}

const ENVIRONMENT_COLORS: Record<string, string> = {
  production: "hsl(var(--chart-1))",
  staging: "hsl(var(--chart-3))",
  development: "hsl(var(--chart-2))",
};

export function EnvironmentBreakdownChart({ data }: EnvironmentBreakdownChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Spend by Environment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={ENVIRONMENT_COLORS[entry.name] || "hsl(var(--muted))"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((env) => (
            <div key={env.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: ENVIRONMENT_COLORS[env.name] || "hsl(var(--muted))" }}
                />
                <span className="capitalize">{env.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{formatCurrency(env.value)}</span>
                <span className="text-muted-foreground">
                  ({((env.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
