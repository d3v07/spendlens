import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostDriver {
  service: string;
  currentCost: number;
  previousCost: number;
  change: number;
}

interface TopCostDriversTableProps {
  data: CostDriver[];
}

export function TopCostDriversTable({ data }: TopCostDriversTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeBadge = (change: number) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-mono",
          isPositive && "border-destructive/30 bg-destructive/10 text-destructive",
          isNegative && "border-success/30 bg-success/10 text-success",
          !isPositive && !isNegative && "border-muted"
        )}
      >
        {isPositive ? "+" : ""}{change.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Top Cost Drivers</h3>
        <p className="text-sm text-muted-foreground">
          Services with highest spend and period-over-period changes
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead className="text-right">Current Period</TableHead>
            <TableHead className="text-right">Previous Period</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 10).map((driver, index) => (
            <TableRow key={driver.service}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">#{index + 1}</span>
                  {driver.service}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(driver.currentCost)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatCurrency(driver.previousCost)}
              </TableCell>
              <TableCell className="text-right">
                {getChangeBadge(driver.change)}
              </TableCell>
              <TableCell>{getTrendIcon(driver.change)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
