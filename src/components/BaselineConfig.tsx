import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Calculator } from 'lucide-react';

export interface BaselineMetrics {
  environment: 'dev' | 'staging' | 'prod';
  p95: number;
  errorRate: number;
  avgResponseTime: number;
  vus: number;
  duration: number;
}

export interface ThresholdConfig {
  p95Threshold: number;
  errorRateThreshold: number;
  avgResponseTimeThreshold: number;
  margin: number;
}

interface BaselineConfigProps {
  onSaveBaseline: (baseline: BaselineMetrics, thresholds: ThresholdConfig) => void;
}

const ENVIRONMENT_MARGINS = {
  dev: { min: 30, max: 50, default: 40 },
  staging: { min: 20, max: 30, default: 25 },
  prod: { min: 10, max: 20, default: 15 },
};

export function BaselineConfig({ onSaveBaseline }: BaselineConfigProps) {
  const [environment, setEnvironment] = useState<'dev' | 'staging' | 'prod'>('dev');
  const [p95, setP95] = useState('420');
  const [errorRate, setErrorRate] = useState('0.1');
  const [avgResponseTime, setAvgResponseTime] = useState('280');
  const [vus, setVus] = useState('20');
  const [duration, setDuration] = useState('5');
  const [customMargin, setCustomMargin] = useState('');

  const getMargin = () => {
    if (customMargin) {
      return parseFloat(customMargin);
    }
    return ENVIRONMENT_MARGINS[environment].default;
  };

  const calculateThresholds = () => {
    const margin = getMargin() / 100;
    const p95Value = parseFloat(p95);
    const errorRateValue = parseFloat(errorRate);
    const avgValue = parseFloat(avgResponseTime);

    return {
      p95Threshold: Math.round(p95Value * (1 + margin)),
      errorRateThreshold: parseFloat((errorRateValue * (1 + margin)).toFixed(2)),
      avgResponseTimeThreshold: Math.round(avgValue * (1 + margin)),
      margin: getMargin(),
    };
  };

  const handleSave = () => {
    const baseline: BaselineMetrics = {
      environment,
      p95: parseFloat(p95),
      errorRate: parseFloat(errorRate),
      avgResponseTime: parseFloat(avgResponseTime),
      vus: parseInt(vus),
      duration: parseInt(duration),
    };

    const thresholds = calculateThresholds();
    onSaveBaseline(baseline, thresholds);
  };

  const thresholds = calculateThresholds();
  const marginRange = ENVIRONMENT_MARGINS[environment];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Baseline & Threshold Configuration</CardTitle>
        <CardDescription>
          Set baseline metrics from your environment to calculate performance thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as any)}>
              <SelectTrigger id="environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">
                  <div className="flex items-center gap-2">
                    <span>🔧 Dev</span>
                  </div>
                </SelectItem>
                <SelectItem value="staging">
                  <div className="flex items-center gap-2">
                    <span>⚡ Staging</span>
                  </div>
                </SelectItem>
                <SelectItem value="prod">
                  <div className="flex items-center gap-2">
                    <span>🔥 Production</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Recommended margin: +{marginRange.min}-{marginRange.max}% (Default: {marginRange.default}%)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vus">Virtual Users (VUs)</Label>
              <Input
                id="vus"
                type="number"
                value={vus}
                onChange={(e) => setVus(e.target.value)}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p95">Baseline P95 Response Time (ms)</Label>
            <Input
              id="p95"
              type="number"
              value={p95}
              onChange={(e) => setP95(e.target.value)}
              placeholder="420"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avgResponseTime">Baseline Avg Response Time (ms)</Label>
            <Input
              id="avgResponseTime"
              type="number"
              value={avgResponseTime}
              onChange={(e) => setAvgResponseTime(e.target.value)}
              placeholder="280"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="errorRate">Baseline Error Rate (%)</Label>
            <Input
              id="errorRate"
              type="number"
              step="0.01"
              value={errorRate}
              onChange={(e) => setErrorRate(e.target.value)}
              placeholder="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customMargin">
              Safety Margin (%)
              <span className="ml-2 text-xs text-muted-foreground">
                Optional - defaults to {marginRange.default}%
              </span>
            </Label>
            <Input
              id="customMargin"
              type="number"
              value={customMargin}
              onChange={(e) => setCustomMargin(e.target.value)}
              placeholder={marginRange.default.toString()}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="size-4" />
            <h4 className="font-medium">Calculated Thresholds</h4>
            <Badge variant="outline">{getMargin()}% margin</Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">P95:</span>
              <code className="font-mono">
                {p95}ms × {(1 + getMargin() / 100).toFixed(2)} = <span className="text-blue-600 font-bold">{thresholds.p95Threshold}ms</span>
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg Response:</span>
              <code className="font-mono">
                {avgResponseTime}ms × {(1 + getMargin() / 100).toFixed(2)} = <span className="text-blue-600 font-bold">{thresholds.avgResponseTimeThreshold}ms</span>
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Error Rate:</span>
              <code className="font-mono">
                {errorRate}% × {(1 + getMargin() / 100).toFixed(2)} = <span className="text-blue-600 font-bold">{thresholds.errorRateThreshold}%</span>
              </code>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 size-4" />
          Save Baseline & Thresholds
        </Button>
      </CardContent>
    </Card>
  );
}
