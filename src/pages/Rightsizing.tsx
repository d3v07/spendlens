import { RightsizingAnalyzer } from '@/components/RightsizingAnalyzer';
import { DemoProfileSwitcher } from '@/components/DemoProfileSwitcher';
import { useDemoData } from '@/contexts/DemoDataContext';

export default function Rightsizing() {
  const { currentProfile, profiles, setProfile, resetDemoData } = useDemoData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resource Rightsizing</h1>
          <p className="text-muted-foreground mt-1">
            Analyze EC2 and RDS instances to identify optimization opportunities
          </p>
        </div>
        <DemoProfileSwitcher
          currentProfile={currentProfile}
          profiles={profiles}
          onProfileChange={setProfile}
          onReset={resetDemoData}
        />
      </div>
      
      <RightsizingAnalyzer />
    </div>
  );
}
