import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Grid3X3, ZoomIn, ZoomOut } from 'lucide-react';
import { Recommendation } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

interface ImpactEffortMatrixProps {
  recommendations: Recommendation[];
  onSelectRecommendation?: (id: string) => void;
}

interface MatrixItem {
  id: string;
  title: string;
  savings: number;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  status: string;
  service: string;
}

const QUADRANT_LABELS = {
  quickWins: { title: 'Quick Wins', subtitle: 'Do these first', color: 'bg-success/20 border-success/40' },
  majorProjects: { title: 'Major Projects', subtitle: 'Plan carefully', color: 'bg-primary/20 border-primary/40' },
  fillIns: { title: 'Fill-Ins', subtitle: 'When time permits', color: 'bg-muted/50 border-muted' },
  thankless: { title: 'Thankless Tasks', subtitle: 'Consider ignoring', color: 'bg-warning/20 border-warning/40' },
};

export function ImpactEffortMatrix({ recommendations, onSelectRecommendation }: ImpactEffortMatrixProps) {
  const [isCompact, setIsCompact] = useState(false);

  // Only show pending recommendations in the matrix
  const pendingRecs = useMemo(() => 
    recommendations.filter(r => r.status === 'pending'),
    [recommendations]
  );

  // Calculate impact score (normalized 0-100 based on savings)
  const maxSavings = useMemo(() => 
    Math.max(...pendingRecs.map(r => r.projected_savings), 1),
    [pendingRecs]
  );

  // Map recommendations to matrix positions
  const matrixItems: MatrixItem[] = useMemo(() => 
    pendingRecs.map(r => ({
      id: r.id,
      title: r.title,
      savings: r.projected_savings,
      effort: r.effort,
      risk: r.risk,
      status: r.status,
      service: r.service_name,
    })),
    [pendingRecs]
  );

  // Group items by quadrant
  const quadrants = useMemo(() => {
    const result = {
      quickWins: [] as MatrixItem[],      // High impact, Low effort
      majorProjects: [] as MatrixItem[],  // High impact, High effort
      fillIns: [] as MatrixItem[],        // Low impact, Low effort
      thankless: [] as MatrixItem[],      // Low impact, High effort
    };

    const medianSavings = maxSavings / 2;

    for (const item of matrixItems) {
      const isHighImpact = item.savings >= medianSavings;
      const isLowEffort = item.effort === 'low' || (item.effort === 'medium' && item.risk === 'low');

      if (isHighImpact && isLowEffort) {
        result.quickWins.push(item);
      } else if (isHighImpact && !isLowEffort) {
        result.majorProjects.push(item);
      } else if (!isHighImpact && isLowEffort) {
        result.fillIns.push(item);
      } else {
        result.thankless.push(item);
      }
    }

    // Sort each quadrant by savings
    Object.keys(result).forEach(key => {
      result[key as keyof typeof result].sort((a, b) => b.savings - a.savings);
    });

    return result;
  }, [matrixItems, maxSavings]);

  const totalPendingSavings = pendingRecs.reduce((sum, r) => sum + r.projected_savings, 0);

  if (pendingRecs.length === 0) {
    return null;
  }

  const QuadrantCell = ({ 
    items, 
    label, 
    position 
  }: { 
    items: MatrixItem[]; 
    label: keyof typeof QUADRANT_LABELS;
    position: string;
  }) => {
    const config = QUADRANT_LABELS[label];
    const quadrantSavings = items.reduce((sum, i) => sum + i.savings, 0);
    
    return (
      <div className={cn(
        "rounded-lg border p-3 min-h-[140px] flex flex-col",
        config.color,
        position
      )}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-sm">{config.title}</h4>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            {items.length}
          </Badge>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No items</p>
          ) : (
            <TooltipProvider>
              <div className={cn(
                "flex flex-wrap gap-1.5",
                isCompact && "gap-1"
              )}>
                {items.slice(0, isCompact ? 6 : 4).map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectRecommendation?.(item.id)}
                        className={cn(
                          "rounded-md text-left transition-all hover:ring-2 hover:ring-primary/50",
                          isCompact 
                            ? "w-8 h-8 flex items-center justify-center bg-background/80 border text-xs font-bold"
                            : "p-2 bg-background/80 border flex-1 min-w-[100px]"
                        )}
                      >
                        {isCompact ? (
                          <span className="truncate">{item.title.charAt(0)}</span>
                        ) : (
                          <>
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.service}</p>
                            <p className="text-xs font-mono text-success mt-1">
                              +${item.savings.toLocaleString()}
                            </p>
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.service}</p>
                      <p className="text-xs font-mono text-success mt-1">
                        +${item.savings.toLocaleString()}/mo savings
                      </p>
                      <p className="text-xs mt-1">
                        {item.effort} effort • {item.risk} risk
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {items.length > (isCompact ? 6 : 4) && (
                  <div className="rounded-md bg-background/60 border px-2 py-1 text-xs text-muted-foreground flex items-center">
                    +{items.length - (isCompact ? 6 : 4)} more
                  </div>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>

        {quadrantSavings > 0 && (
          <div className="mt-2 pt-2 border-t border-current/10 text-xs font-mono text-muted-foreground">
            ${quadrantSavings.toLocaleString()}/mo
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Impact vs Effort Matrix</CardTitle>
              <p className="text-xs text-muted-foreground">
                {pendingRecs.length} pending • ${totalPendingSavings.toLocaleString()}/mo potential
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCompact(!isCompact)}
            className="h-8 w-8 p-0"
          >
            {isCompact ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Matrix Grid */}
        <div className="relative">
          {/* Axis Labels */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium whitespace-nowrap origin-center">
            ← Low Impact | High Impact →
          </div>
          
          <div className="ml-6">
            <div className="text-xs text-muted-foreground font-medium text-center mb-2">
              ← Low Effort | High Effort →
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <QuadrantCell items={quadrants.quickWins} label="quickWins" position="order-1" />
              <QuadrantCell items={quadrants.majorProjects} label="majorProjects" position="order-2" />
              <QuadrantCell items={quadrants.fillIns} label="fillIns" position="order-3" />
              <QuadrantCell items={quadrants.thankless} label="thankless" position="order-4" />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t flex flex-wrap gap-3 text-xs">
          {Object.entries(QUADRANT_LABELS).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded border", config.color)} />
              <span className="text-muted-foreground">{config.title}</span>
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {quadrants[key as keyof typeof quadrants].length}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
