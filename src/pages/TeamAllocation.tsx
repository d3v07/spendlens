import { TeamAllocationDashboard } from '@/components/TeamAllocationDashboard';
import { DemoProfileSwitcher } from '@/components/DemoProfileSwitcher';
import { useDemoData } from '@/contexts/DemoDataContext';

export default function TeamAllocation() {
  const { currentProfile, profiles, setProfile, resetDemoData } = useDemoData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team Cost Allocation</h1>
          <p className="text-muted-foreground mt-1">
            Track budgets, monitor spend trends, and manage team-level cost alerts
          </p>
        </div>
        <DemoProfileSwitcher
          currentProfile={currentProfile}
          profiles={profiles}
          onProfileChange={setProfile}
          onReset={resetDemoData}
        />
      </div>
      
      <TeamAllocationDashboard />
    </div>
  );
}
