import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { AnomalyCard } from './AnomalyCard';
import { Anomaly } from '@/lib/demo-data';

interface AnomaliesPanelProps {
  anomalies: Anomaly[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function AnomaliesPanel({ anomalies, onAcknowledge, onDismiss }: AnomaliesPanelProps) {
  const newCount = anomalies.filter(a => a.status === 'new').length;
  const acknowledgedCount = anomalies.filter(a => a.status === 'acknowledged').length;

  if (anomalies.length === 0) {
    return (
      <Card className="border-success/30 bg-gradient-to-br from-success/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Anomalies Detected</h3>
              <p className="text-sm text-muted-foreground">
                Your spending patterns look normal. We'll alert you if anything unusual is detected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">Cost Anomalies</h3>
            <p className="text-sm text-muted-foreground">Unusual spending patterns detected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {newCount} new
            </Badge>
          )}
          {acknowledgedCount > 0 && (
            <Badge variant="secondary">
              {acknowledgedCount} acknowledged
            </Badge>
          )}
        </div>
      </div>

      {/* Anomaly Cards */}
      <div className="space-y-3">
        {anomalies.map((anomaly) => (
          <AnomalyCard
            key={anomaly.id}
            anomaly={anomaly}
            onAcknowledge={onAcknowledge}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
