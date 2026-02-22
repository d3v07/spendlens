import { useState } from 'react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingDown, Save } from 'lucide-react';

export default function Simulator() {
  const { totals } = useDemoData();
  
  const [logRetention, setLogRetention] = useState([90]);
  const [devShutdown, setDevShutdown] = useState(false);
  const [useReserved, setUseReserved] = useState(false);
  const [storageClass, setStorageClass] = useState([0]);

  // Calculate savings based on parameters
  const logSavings = ((90 - logRetention[0]) / 90) * 156;
  const devSavings = devShutdown ? 812.50 : 0;
  const reservedSavings = useReserved ? 2940 : 0;
  const storageSavings = storageClass[0] * 0.5;
  
  const totalSavings = logSavings + devSavings + reservedSavings + storageSavings;
  const projectedCost = totals.thisMonth - totalSavings;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">What-If Simulator</h1>
        <p className="text-muted-foreground">Model cost scenarios and project savings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Parameters */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Adjust Parameters</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>CloudWatch Log Retention (days)</Label>
                  <span className="font-medium">{logRetention[0]} days</span>
                </div>
                <Slider value={logRetention} onValueChange={setLogRetention} max={90} min={7} step={1} />
                <p className="text-sm text-muted-foreground">Reducing from 90 to {logRetention[0]} days saves ${logSavings.toFixed(2)}/mo</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>S3 Data to Glacier (%)</Label>
                  <span className="font-medium">{storageClass[0]}%</span>
                </div>
                <Slider value={storageClass} onValueChange={setStorageClass} max={100} min={0} step={5} />
                <p className="text-sm text-muted-foreground">Moving {storageClass[0]}% of cold data saves ${storageSavings.toFixed(2)}/mo</p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Schedule Dev Environment Shutdown</Label>
                  <p className="text-sm text-muted-foreground">Shut down outside business hours (saves 65%)</p>
                </div>
                <Switch checked={devShutdown} onCheckedChange={setDevShutdown} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Purchase RDS Reserved Instances</Label>
                  <p className="text-sm text-muted-foreground">1-year commitment for 35% savings</p>
                </div>
                <Switch checked={useReserved} onCheckedChange={setUseReserved} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader><CardTitle>Projected Impact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Monthly</span>
                <span className="font-semibold">${totals.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 justify-center py-2">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Projected Monthly</span>
                <span className="font-semibold text-success">${projectedCost.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Monthly Savings</span>
                  <span className="text-xl font-bold text-success">${totalSavings.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Annual Savings</span>
                  <span className="font-semibold text-success">${(totalSavings * 12).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg">
            <Save className="mr-2 h-4 w-4" /> Save Scenario
          </Button>
        </div>
      </div>
    </div>
  );
}
