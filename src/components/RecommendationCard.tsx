import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Clock, 
  Shield,
  Zap,
  FileText,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Recommendation, RecommendationStatus, EffortLevel, RiskLevel } from '@/lib/demo-data';

export interface AIRanking {
  id: string;
  priority: number;
  confidence: number;
  reasoning: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusChange: (id: string, status: RecommendationStatus) => void;
  aiRanking?: AIRanking;
}

const confidenceColors = {
  high: 'bg-success/15 text-success border-success/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-muted text-muted-foreground border-muted',
};

const effortConfig: Record<EffortLevel, { label: string; color: string; icon: typeof Zap }> = {
  low: { label: 'Low Effort', color: 'text-success', icon: Zap },
  medium: { label: 'Medium Effort', color: 'text-warning', icon: Zap },
  high: { label: 'High Effort', color: 'text-destructive', icon: Zap },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; icon: typeof Shield }> = {
  low: { label: 'Low Risk', color: 'text-success', icon: Shield },
  medium: { label: 'Medium Risk', color: 'text-warning', icon: Shield },
  high: { label: 'High Risk', color: 'text-destructive', icon: Shield },
};

const statusConfig: Record<RecommendationStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  accepted: { label: 'Accepted', color: 'text-success', bgColor: 'bg-success/15' },
  ignored: { label: 'Ignored', color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  deferred: { label: 'Deferred', color: 'text-warning', bgColor: 'bg-warning/15' },
};

export function RecommendationCard({ recommendation, onStatusChange, aiRanking }: RecommendationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rec = recommendation;
  
  const EffortIcon = effortConfig[rec.effort].icon;
  const RiskIcon = riskConfig[rec.risk].icon;
  const statusInfo = statusConfig[rec.status];

  const isActioned = rec.status !== 'pending';
  const hasAIRanking = !!aiRanking;

  return (
    <Card className={cn(
      "transition-all duration-200 relative",
      isActioned && "opacity-75",
      !isActioned && "hover:shadow-md",
      hasAIRanking && "ring-1 ring-primary/20"
    )}>
      {/* AI Priority Badge */}
      {hasAIRanking && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md">
            #{aiRanking.priority}
          </div>
        </div>
      )}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">{rec.title}</CardTitle>
                  {isActioned && (
                    <Badge variant="outline" className={cn("text-xs", statusInfo.bgColor, statusInfo.color)}>
                      {statusInfo.label}
                    </Badge>
                  )}
                </div>
                <CardDescription>{rec.service_name} • {rec.category}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={cn("text-xs", confidenceColors[rec.confidence])}>
                {rec.confidence} confidence
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{rec.description}</p>
          
          {/* AI Reasoning (when available) */}
          {hasAIRanking && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-primary">AI Analysis</span>
                  <span className="text-xs text-muted-foreground">({aiRanking.confidence}% confidence)</span>
                </div>
                <p className="text-sm text-muted-foreground">{aiRanking.reasoning}</p>
              </div>
            </div>
          )}
          
          {/* Effort & Risk Badges */}
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-1.5 text-sm", effortConfig[rec.effort].color)}>
              <EffortIcon className="h-4 w-4" />
              <span>{effortConfig[rec.effort].label}</span>
            </div>
            <div className={cn("flex items-center gap-1.5 text-sm", riskConfig[rec.risk].color)}>
              <RiskIcon className="h-4 w-4" />
              <span>{riskConfig[rec.risk].label}</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Cost</p>
              <p className="font-semibold font-mono">${rec.current_cost.toLocaleString()}/mo</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projected Savings</p>
              <p className="font-semibold font-mono text-success">${rec.projected_savings.toLocaleString()}/mo</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="font-semibold font-mono">{Math.round((rec.projected_savings / rec.current_cost) * 100)}%</p>
            </div>
          </div>

          {/* Expandable Evidence Section */}
          <CollapsibleContent className="space-y-4">
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Evidence & Analysis</h4>
              </div>
              <ul className="space-y-2">
                {rec.evidence.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            {!isActioned && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  className="gap-1.5 bg-success hover:bg-success/90"
                  onClick={() => onStatusChange(rec.id, 'accepted')}
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => onStatusChange(rec.id, 'deferred')}
                >
                  <Clock className="h-4 w-4" />
                  Defer
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => onStatusChange(rec.id, 'ignored')}
                >
                  <X className="h-4 w-4" />
                  Ignore
                </Button>
              </div>
            )}

            {isActioned && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange(rec.id, 'pending')}
                >
                  Reset to Pending
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
