import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Recommendation } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

interface QuickWinsPanelProps {
  recommendations: Recommendation[];
  onAccept: (id: string) => void;
}

export function QuickWinsPanel({ recommendations, onAccept }: QuickWinsPanelProps) {
  // Calculate quick wins: low effort, low risk, pending status
  const quickWins = useMemo(() => {
    return recommendations
      .filter(r => 
        r.status === 'pending' && 
        r.effort === 'low' && 
        r.risk === 'low'
      )
      .sort((a, b) => b.projected_savings - a.projected_savings)
      .slice(0, 3);
  }, [recommendations]);

  // Find the single best action (highest ROI with low effort)
  const bestAction = useMemo(() => {
    const pending = recommendations.filter(r => r.status === 'pending');
    if (pending.length === 0) return null;
    
    // Score: savings / effort weight, adjusted by risk
    const effortWeight = { low: 1, medium: 2, high: 3 };
    const riskMultiplier = { low: 1, medium: 0.8, high: 0.6 };
    
    return pending.reduce((best, current) => {
      const bestScore = best.projected_savings / effortWeight[best.effort] * riskMultiplier[best.risk];
      const currentScore = current.projected_savings / effortWeight[current.effort] * riskMultiplier[current.risk];
      return currentScore > bestScore ? current : best;
    });
  }, [recommendations]);

  const totalQuickWinSavings = quickWins.reduce((sum, r) => sum + r.projected_savings, 0);
  const pendingCount = recommendations.filter(r => r.status === 'pending').length;

  if (pendingCount === 0) {
    return (
      <Card className="border-success/30 bg-gradient-to-br from-success/5 to-transparent">
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">All Caught Up!</h3>
          <p className="text-sm text-muted-foreground">
            You've reviewed all recommendations. Great job!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">What Should I Do First?</CardTitle>
            <p className="text-xs text-muted-foreground">Your personalized action plan</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Best Single Action */}
        {bestAction && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">Top Priority</span>
                </div>
                <h4 className="font-semibold truncate">{bestAction.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{bestAction.service_name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="font-mono text-success">
                    +${bestAction.projected_savings.toLocaleString()}/mo
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    bestAction.effort === 'low' && "text-success border-success/30",
                    bestAction.effort === 'medium' && "text-warning border-warning/30",
                    bestAction.effort === 'high' && "text-destructive border-destructive/30"
                  )}>
                    {bestAction.effort} effort
                  </Badge>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => onAccept(bestAction.id)}
                className="shrink-0 gap-1.5"
              >
                Accept
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Wins Section */}
        {quickWins.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Quick Wins</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                ${totalQuickWinSavings.toLocaleString()}/mo potential
              </Badge>
            </div>
            <div className="space-y-2">
              {quickWins.map((rec, index) => (
                <div 
                  key={rec.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.service_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono text-success">
                      +${rec.projected_savings.toLocaleString()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onAccept(rec.id)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>{pendingCount} recommendations pending review</span>
          <span className="font-mono">
            ${recommendations.filter(r => r.status === 'pending').reduce((s, r) => s + r.projected_savings, 0).toLocaleString()}/mo available
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
