import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Filter, BarChart3 } from 'lucide-react';
import { RecommendationCard } from '@/components/RecommendationCard';
import { ExportButton } from '@/components/ExportButton';
import { AIPrioritizePanel, AIRanking } from '@/components/AIPrioritizePanel';
import { QuickWinsPanel } from '@/components/QuickWinsPanel';
import { ImpactEffortMatrix } from '@/components/ImpactEffortMatrix';
import { RecommendationStatus } from '@/lib/demo-data';
import { toast } from 'sonner';

type FilterStatus = 'all' | RecommendationStatus;

export default function Recommendations() {
  const { recommendations, updateRecommendationStatus } = useDemoData();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [aiRankings, setAiRankings] = useState<AIRanking[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  
  const isAIPrioritized = aiRankings.length > 0;
  
  // Sort recommendations by AI priority if available
  const sortedRecommendations = useMemo(() => {
    if (!isAIPrioritized) return recommendations;
    
    const rankingMap = new Map(aiRankings.map(r => [r.id, r.priority]));
    return [...recommendations].sort((a, b) => {
      const priorityA = rankingMap.get(a.id) ?? 999;
      const priorityB = rankingMap.get(b.id) ?? 999;
      return priorityA - priorityB;
    });
  }, [recommendations, aiRankings, isAIPrioritized]);
  
  const filteredRecommendations = statusFilter === 'all' 
    ? sortedRecommendations 
    : sortedRecommendations.filter(r => r.status === statusFilter);
  
  // Get AI ranking for a recommendation
  const getAIRanking = (id: string): AIRanking | undefined => {
    return aiRankings.find(r => r.id === id);
  };
  
  const handleAIPrioritize = (rankings: AIRanking[], summary: string) => {
    setAiRankings(rankings);
    setAiSummary(summary);
  };
  
  const handleClearAI = () => {
    setAiRankings([]);
    setAiSummary('');
  };
  
  const handleAcceptRecommendation = useCallback((id: string) => {
    updateRecommendationStatus(id, 'accepted');
  }, [updateRecommendationStatus]);

  // Keyboard shortcut: Accept first pending recommendation with 'a' key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const pendingRecs = filteredRecommendations.filter(r => r.status === 'pending');
      
      if (event.key === 'a' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (pendingRecs.length > 0) {
          handleAcceptRecommendation(pendingRecs[0].id);
          toast.success(`Accepted: ${pendingRecs[0].title}`, { duration: 2000 });
        }
      }
      
      if (event.key === 'i' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (pendingRecs.length > 0) {
          updateRecommendationStatus(pendingRecs[0].id, 'ignored');
          toast.info(`Ignored: ${pendingRecs[0].title}`, { duration: 2000 });
        }
      }
      
      if (event.key === 'd' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (pendingRecs.length > 0) {
          updateRecommendationStatus(pendingRecs[0].id, 'deferred');
          toast.info(`Deferred: ${pendingRecs[0].title}`, { duration: 2000 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredRecommendations, handleAcceptRecommendation, updateRecommendationStatus]);
  
  const totalSavings = recommendations.reduce((sum, r) => sum + r.projected_savings, 0);
  const pendingSavings = recommendations
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.projected_savings, 0);
  const acceptedSavings = recommendations
    .filter(r => r.status === 'accepted')
    .reduce((sum, r) => sum + r.projected_savings, 0);

  const statusCounts = {
    all: recommendations.length,
    pending: recommendations.filter(r => r.status === 'pending').length,
    accepted: recommendations.filter(r => r.status === 'accepted').length,
    ignored: recommendations.filter(r => r.status === 'ignored').length,
    deferred: recommendations.filter(r => r.status === 'deferred').length,
  };

  // Group recommendations by category for export
  const exportData = recommendations.map(rec => ({
    title: rec.title,
    category: rec.category,
    service: rec.service_name,
    current_cost: rec.current_cost,
    projected_savings: rec.projected_savings,
    confidence: rec.confidence,
    effort: rec.effort,
    risk: rec.risk,
    status: rec.status,
  }));

  // Group by category for summary
  const categoryBreakdown = recommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) {
      acc[rec.category] = { count: 0, savings: 0 };
    }
    acc[rec.category].count++;
    acc[rec.category].savings += rec.projected_savings;
    return acc;
  }, {} as Record<string, { count: number; savings: number }>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recommendations</h1>
          <p className="text-muted-foreground">Actionable cost optimization insights</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={exportData} filename="spendlens-recommendations" title="Cost Optimization Recommendations" />
        </div>
      </div>

      {/* Savings Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Potential Savings</p>
                <p className="text-2xl font-bold text-primary">${totalSavings.toLocaleString()}/mo</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-warning">${pendingSavings.toLocaleString()}/mo</p>
                <p className="text-xs text-muted-foreground">{statusCounts.pending} recommendations</p>
              </div>
              <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">
                {statusCounts.pending}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted Savings</p>
                <p className="text-2xl font-bold text-success">${acceptedSavings.toLocaleString()}/mo</p>
                <p className="text-xs text-muted-foreground">{statusCounts.accepted} accepted</p>
              </div>
              <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                {statusCounts.accepted}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Savings by Category</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryBreakdown).map(([category, data]) => (
              <div 
                key={category} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm font-medium">{category}</span>
                <Badge variant="secondary" className="font-mono">
                  ${data.savings.toLocaleString()}
                </Badge>
                <span className="text-xs text-muted-foreground">({data.count})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decision Support Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* What Should I Do First Panel */}
        <QuickWinsPanel 
          recommendations={recommendations} 
          onAccept={handleAcceptRecommendation}
        />
        
        {/* Impact vs Effort Matrix */}
        <ImpactEffortMatrix 
          recommendations={recommendations}
          onSelectRecommendation={(id) => {
            // Could scroll to card or highlight it
            console.log('Selected recommendation:', id);
          }}
        />
      </div>

      {/* AI Prioritization Panel */}
      <AIPrioritizePanel
        recommendations={recommendations}
        onPrioritize={handleAIPrioritize}
        onClear={handleClearAI}
        isActive={isAIPrioritized}
        rankings={aiRankings}
        summary={aiSummary}
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              All <Badge variant="secondary" className="ml-1 h-5 px-1.5">{statusCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              Pending <Badge variant="secondary" className="ml-1 h-5 px-1.5">{statusCounts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-1.5">
              Accepted <Badge variant="secondary" className="ml-1 h-5 px-1.5">{statusCounts.accepted}</Badge>
            </TabsTrigger>
            <TabsTrigger value="deferred" className="gap-1.5">
              Deferred <Badge variant="secondary" className="ml-1 h-5 px-1.5">{statusCounts.deferred}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ignored" className="gap-1.5">
              Ignored <Badge variant="secondary" className="ml-1 h-5 px-1.5">{statusCounts.ignored}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Recommendation Cards */}
      <div className="grid gap-4">
        {filteredRecommendations.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              <p>No recommendations match the current filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map((rec) => (
            <RecommendationCard 
              key={rec.id} 
              recommendation={rec} 
              onStatusChange={updateRecommendationStatus}
              aiRanking={getAIRanking(rec.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
