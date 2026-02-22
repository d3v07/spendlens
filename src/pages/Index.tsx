import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingDown, BarChart3, Lightbulb, ArrowRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">SpendLens</span>
        </div>
        <Button onClick={() => navigate('/auth')}>
          Sign In <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
          Cloud Cost Visibility & Optimization
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Understand your cloud spending, identify optimization opportunities, and model cost savings scenarios with SpendLens.
        </p>
        <Button size="lg" onClick={() => navigate('/auth')}>
          Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="bg-card p-6 rounded-xl shadow-sm border">
            <BarChart3 className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cost Dashboards</h3>
            <p className="text-muted-foreground">Real-time visualization of spending by service, team, and environment.</p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-sm border">
            <Lightbulb className="h-10 w-10 text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-muted-foreground">AI-powered insights to identify idle resources and optimization opportunities.</p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-sm border">
            <TrendingDown className="h-10 w-10 text-success mb-4" />
            <h3 className="text-lg font-semibold mb-2">What-If Simulator</h3>
            <p className="text-muted-foreground">Model cost scenarios before making changes to predict savings.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
