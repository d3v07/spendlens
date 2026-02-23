import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Anomaly } from '@/lib/demo-data';

interface AnomalyCardProps {
  anomaly: Anomaly;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function AnomalyCard({ anomaly, onAcknowledge, onDismiss }: AnomalyCardProps) {
  const isNew = anomaly.status === 'new';
  const isAcknowledged = anomaly.status === 'acknowledged';

  return (
    <Card className={cn(
      "transition-all duration-200",
      isNew && "border-destructive/50 bg-destructive/5",
      isAcknowledged && "opacity-75"
    )}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            isNew ? "bg-destructive/10" : "bg-warning/10"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5",
              isNew ? "text-destructive" : "text-warning"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{anomaly.service} Spend Spike</h4>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isNew && "bg-destructive/10 text-destructive border-destructive/30",
                  isAcknowledged && "bg-muted text-muted-foreground"
                )}
              >
                {isNew ? 'New' : 'Acknowledged'}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {anomaly.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Normal:</span>
                <span className="font-mono">${anomaly.normalSpend.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Actual:</span>
                <span className="font-mono text-destructive">${anomaly.actualSpend.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-destructive">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-semibold">+{anomaly.percentageIncrease}%</span>
              </div>
            </div>

            {/* Detected date */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Detected: {new Date(anomaly.detectedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isNew && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAcknowledge(anomaly.id)}
                  className="h-8 gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss(anomaly.id)}
                  className="h-8 gap-1.5 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Dismiss
                </Button>
              </>
            )}
            {isAcknowledged && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(anomaly.id)}
                className="h-8 text-muted-foreground"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
