import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UnallocatedSpendCardProps {
  unallocatedAmount: number;
  totalAmount: number;
}

export function UnallocatedSpendCard({ unallocatedAmount, totalAmount }: UnallocatedSpendCardProps) {
  const percentage = totalAmount > 0 ? (unallocatedAmount / totalAmount) * 100 : 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (percentage < 1) {
    return null; // Don't show if negligible
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-warning/20 p-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unallocated Spend</span>
              <span className="font-mono text-sm">{formatCurrency(unallocatedAmount)}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {percentage.toFixed(1)}% of costs lack proper tagging
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
