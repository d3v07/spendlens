import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, AlertCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Recommendation } from '@/lib/demo-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface AIRanking {
  id: string;
  priority: number;
  confidence: number;
  reasoning: string;
}

interface AIPrioritizePanelProps {
  recommendations: Recommendation[];
  onPrioritize: (rankings: AIRanking[], summary: string) => void;
  onClear: () => void;
  isActive: boolean;
  rankings: AIRanking[];
  summary: string;
}

export function AIPrioritizePanel({
  recommendations,
  onPrioritize,
  onClear,
  isActive,
  rankings,
  summary,
}: AIPrioritizePanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingRecs = recommendations.filter(r => r.status === 'pending');

  const handlePrioritize = async () => {
    if (pendingRecs.length === 0) {
      setError('No pending recommendations to prioritize');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-prioritize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            recommendations: pendingRecs.map(r => ({
              id: r.id,
              title: r.title,
              projected_savings: r.projected_savings,
              current_cost: r.current_cost,
              effort: r.effort,
              risk: r.risk,
              category: r.category,
              evidence: r.evidence,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      onPrioritize(data.rankings, data.summary);
    } catch (err) {
      console.error('AI prioritization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to prioritize recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-success';
    if (confidence >= 60) return 'bg-warning';
    return 'bg-muted-foreground';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Prioritization</CardTitle>
              <p className="text-xs text-muted-foreground">Let AI rank recommendations by ROI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={handlePrioritize}
              disabled={isLoading || pendingRecs.length === 0}
              className="h-8 gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  {isActive ? 'Re-prioritize' : 'Prioritize'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {(error || isActive) && (
        <CardContent className="pt-0">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isActive && !error && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <div className="space-y-3">
                {/* Summary */}
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {summary}
                </p>

                {/* Compact ranking preview */}
                <div className="flex flex-wrap gap-2">
                  {rankings.slice(0, 3).map((ranking, index) => {
                    const rec = recommendations.find(r => r.id === ranking.id);
                    if (!rec) return null;
                    return (
                      <Badge
                        key={ranking.id}
                        variant="outline"
                        className="gap-1.5 py-1 px-2"
                      >
                        <span className="font-bold text-primary">#{index + 1}</span>
                        <span className="truncate max-w-[120px]">{rec.title}</span>
                        <span className="text-muted-foreground">{ranking.confidence}%</span>
                      </Badge>
                    );
                  })}
                  {rankings.length > 3 && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                        +{rankings.length - 3} more
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>

                {/* Expanded details */}
                <CollapsibleContent>
                  <div className="space-y-2 pt-2 border-t">
                    {rankings.map((ranking, index) => {
                      const rec = recommendations.find(r => r.id === ranking.id);
                      if (!rec) return null;
                      return (
                        <div
                          key={ranking.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-6 w-6 p-0 flex items-center justify-center font-bold",
                              index === 0 && "bg-primary text-primary-foreground"
                            )}
                          >
                            {index + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{rec.title}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                ${rec.projected_savings.toLocaleString()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {ranking.reasoning}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16">
                              <Progress
                                value={ranking.confidence}
                                className="h-1.5"
                                indicatorClassName={getConfidenceColor(ranking.confidence)}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">
                              {ranking.confidence}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </CardContent>
      )}
    </Card>
  );
}
