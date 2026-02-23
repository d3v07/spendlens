import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bell, CheckCircle2, Clock, History } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

type EventType = 'exceeded' | 'warning' | 'resolved';

export interface AlertHistoryEvent {
  id: string;
  alertId: string;
  alertName: string;
  eventType: EventType;
  triggeredAt: Date;
  threshold: number;
  amountAtTrigger: number;
  filterTeam: string | null;
  filterService: string | null;
  filterEnvironment: string | null;
}

// Generate realistic demo history events
export function generateDemoHistory(): AlertHistoryEvent[] {
  const now = new Date();
  
  const exceeded: EventType = 'exceeded';
  const warning: EventType = 'warning';
  const resolved: EventType = 'resolved';
  
  const events: AlertHistoryEvent[] = [
    {
      id: 'hist-1',
      alertId: '1',
      alertName: 'Monthly Cloud Budget',
      eventType: exceeded,
      triggeredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      threshold: 50000,
      amountAtTrigger: 51234.56,
      filterTeam: null,
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: 'hist-2',
      alertId: '1',
      alertName: 'Monthly Cloud Budget',
      eventType: warning,
      triggeredAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
      threshold: 50000,
      amountAtTrigger: 42500.00,
      filterTeam: null,
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: 'hist-3',
      alertId: '2',
      alertName: 'Engineering Team Weekly',
      eventType: exceeded,
      triggeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      threshold: 8000,
      amountAtTrigger: 8456.78,
      filterTeam: 'Engineering',
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: 'hist-4',
      alertId: '3',
      alertName: 'Production EC2 Daily',
      eventType: warning,
      triggeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      threshold: 800,
      amountAtTrigger: 678.90,
      filterTeam: null,
      filterService: 'EC2',
      filterEnvironment: 'production',
    },
    {
      id: 'hist-5',
      alertId: '3',
      alertName: 'Production EC2 Daily',
      eventType: resolved,
      triggeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      threshold: 800,
      amountAtTrigger: 756.00,
      filterTeam: null,
      filterService: 'EC2',
      filterEnvironment: 'production',
    },
    {
      id: 'hist-6',
      alertId: '4',
      alertName: 'DevOps S3 Monthly',
      eventType: exceeded,
      triggeredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      threshold: 2000,
      amountAtTrigger: 2145.32,
      filterTeam: 'DevOps',
      filterService: 'S3',
      filterEnvironment: null,
    },
    {
      id: 'hist-7',
      alertId: '2',
      alertName: 'Engineering Team Weekly',
      eventType: warning,
      triggeredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      threshold: 8000,
      amountAtTrigger: 6890.00,
      filterTeam: 'Engineering',
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: 'hist-8',
      alertId: '1',
      alertName: 'Monthly Cloud Budget',
      eventType: resolved,
      triggeredAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      threshold: 50000,
      amountAtTrigger: 48900.00,
      filterTeam: null,
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: 'hist-9',
      alertId: '1',
      alertName: 'Monthly Cloud Budget',
      eventType: exceeded,
      triggeredAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      threshold: 50000,
      amountAtTrigger: 52100.00,
      filterTeam: null,
      filterService: null,
      filterEnvironment: null,
    },
    {
      id: 'hist-10',
      alertId: '3',
      alertName: 'Production EC2 Daily',
      eventType: exceeded,
      triggeredAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      threshold: 800,
      amountAtTrigger: 892.45,
      filterTeam: null,
      filterService: 'EC2',
      filterEnvironment: 'production',
    },
  ];
  
  return events.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
}

interface AlertHistoryProps {
  history: AlertHistoryEvent[];
}

export function AlertHistory({ history }: AlertHistoryProps) {
  const eventCounts = useMemo(() => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentEvents = history.filter(e => e.triggeredAt >= last7Days);
    
    return {
      exceeded: recentEvents.filter(e => e.eventType === 'exceeded').length,
      warning: recentEvents.filter(e => e.eventType === 'warning').length,
      resolved: recentEvents.filter(e => e.eventType === 'resolved').length,
    };
  }, [history]);

  const getEventIcon = (eventType: EventType) => {
    switch (eventType) {
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-warning" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadge = (eventType: EventType) => {
    switch (eventType) {
      case 'exceeded':
        return <Badge variant="destructive">Exceeded</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">Warning</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Alert History
            </CardTitle>
            <CardDescription>
              Recent threshold triggers and resolutions
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{eventCounts.exceeded} exceeded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">{eventCounts.warning} warnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-muted-foreground">{eventCounts.resolved} resolved</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alert history yet</p>
            <p className="text-sm">Events will appear here when alerts are triggered</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {history.map((event) => (
                  <div key={event.id} className="relative flex gap-4 pl-8">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-2 bg-background flex items-center justify-center ${
                      event.eventType === 'exceeded' 
                        ? 'border-destructive' 
                        : event.eventType === 'warning' 
                        ? 'border-warning' 
                        : 'border-success'
                    }`}>
                      {getEventIcon(event.eventType)}
                    </div>
                    
                    <div className={`flex-1 p-3 rounded-lg border ${
                      event.eventType === 'exceeded'
                        ? 'border-destructive/30 bg-destructive/5'
                        : event.eventType === 'warning'
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-success/30 bg-success/5'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium">{event.alertName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(event.triggeredAt, 'MMM d, yyyy • h:mm a')}
                            <span className="mx-1">•</span>
                            {formatDistanceToNow(event.triggeredAt, { addSuffix: true })}
                          </p>
                        </div>
                        {getEventBadge(event.eventType)}
                      </div>
                      
                      <div className="text-sm">
                        {event.eventType === 'exceeded' && (
                          <p className="text-muted-foreground">
                            Spending reached <span className="font-medium text-destructive">${event.amountAtTrigger.toLocaleString()}</span>
                            {' '}exceeding threshold of ${event.threshold.toLocaleString()}
                          </p>
                        )}
                        {event.eventType === 'warning' && (
                          <p className="text-muted-foreground">
                            Spending reached <span className="font-medium text-warning">${event.amountAtTrigger.toLocaleString()}</span>
                            {' '}({Math.round((event.amountAtTrigger / event.threshold) * 100)}% of ${event.threshold.toLocaleString()} threshold)
                          </p>
                        )}
                        {event.eventType === 'resolved' && (
                          <p className="text-muted-foreground">
                            Alert resolved - spending at <span className="font-medium text-success">${event.amountAtTrigger.toLocaleString()}</span>
                            {' '}(within ${event.threshold.toLocaleString()} threshold)
                          </p>
                        )}
                      </div>
                      
                      {(event.filterTeam || event.filterService || event.filterEnvironment) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          {event.filterTeam && (
                            <Badge variant="outline" className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/30">
                              {event.filterTeam}
                            </Badge>
                          )}
                          {event.filterService && (
                            <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2 border-chart-2/30">
                              {event.filterService}
                            </Badge>
                          )}
                          {event.filterEnvironment && (
                            <Badge variant="outline" className="text-xs bg-chart-3/10 text-chart-3 border-chart-3/30 capitalize">
                              {event.filterEnvironment}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
