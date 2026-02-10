import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface TestCaseConfig {
  testType: string;
  coverage: number;
  includeNegative: boolean;
  includeEdgeCases: boolean;
  includePerformance: boolean;
  priority: string;
}

interface ConfigPanelProps {
  config: TestCaseConfig;
  onConfigChange: (config: TestCaseConfig) => void;
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const updateConfig = (key: keyof TestCaseConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Generation Configuration</CardTitle>
        <CardDescription>Customize how AI generates your test cases</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="test-type">Test Type</Label>
          <Select 
            value={config.testType} 
            onValueChange={(value) => updateConfig('testType', value)}
          >
            <SelectTrigger id="test-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="functional">Functional Testing</SelectItem>
              <SelectItem value="integration">Integration Testing</SelectItem>
              <SelectItem value="e2e">End-to-End Testing</SelectItem>
              <SelectItem value="regression">Regression Testing</SelectItem>
              <SelectItem value="acceptance">User Acceptance Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority Level</Label>
          <Select 
            value={config.priority} 
            onValueChange={(value) => updateConfig('priority', value)}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="high">High & Critical</SelectItem>
              <SelectItem value="medium">Medium & Above</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="coverage">Coverage Level: {config.coverage}%</Label>
          </div>
          <Slider
            id="coverage"
            min={20}
            max={100}
            step={10}
            value={[config.coverage]}
            onValueChange={(value) => updateConfig('coverage', value[0])}
          />
          <p className="text-xs text-muted-foreground">Higher coverage generates more comprehensive test cases</p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="negative">Negative Test Cases</Label>
              <p className="text-xs text-muted-foreground">Test invalid inputs and error scenarios</p>
            </div>
            <Switch
              id="negative"
              checked={config.includeNegative}
              onCheckedChange={(checked) => updateConfig('includeNegative', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edge">Edge Cases</Label>
              <p className="text-xs text-muted-foreground">Test boundary conditions and limits</p>
            </div>
            <Switch
              id="edge"
              checked={config.includeEdgeCases}
              onCheckedChange={(checked) => updateConfig('includeEdgeCases', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="performance">Performance Tests</Label>
              <p className="text-xs text-muted-foreground">Include load and response time tests</p>
            </div>
            <Switch
              id="performance"
              checked={config.includePerformance}
              onCheckedChange={(checked) => updateConfig('includePerformance', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
