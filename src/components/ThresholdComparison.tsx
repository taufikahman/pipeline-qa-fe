import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { K6Metrics } from './MetricsOverview';
import { BaselineMetrics, ThresholdConfig } from './BaselineConfig';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ThresholdComparisonProps {
  baseline: BaselineMetrics | null;
  thresholds: ThresholdConfig | null;
  currentMetrics: K6Metrics | null;
}

export function ThresholdComparison({ baseline, thresholds, currentMetrics }: ThresholdComparisonProps) {
  if (!baseline || !thresholds || !currentMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Threshold Comparison</CardTitle>
          <CardDescription>
            Configure baseline and run a test to see threshold comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          Set baseline and run a performance test
        </CardContent>
      </Card>
    );
  }

  const getStatus = (current: number, threshold: number, isError: boolean = false) => {
    const percentage = (current / threshold) * 100;
    
    if (isError) {
      // For error rates, lower is better
      if (current <= threshold) return { status: 'pass', icon: CheckCircle, color: 'text-green-600' };
      if (current <= threshold * 1.2) return { status: 'warning', icon: AlertTriangle, color: 'text-yellow-600' };
      return { status: 'fail', icon: XCircle, color: 'text-red-600' };
    } else {
      // For response times, lower is better
      if (current <= threshold) return { status: 'pass', icon: CheckCircle, color: 'text-green-600' };
      if (current <= threshold * 1.1) return { status: 'warning', icon: AlertTriangle, color: 'text-yellow-600' };
      return { status: 'fail', icon: XCircle, color: 'text-red-600' };
    }
  };

  const p95Status = getStatus(currentMetrics.p95ResponseTime, thresholds.p95Threshold);
  const avgStatus = getStatus(currentMetrics.avgResponseTime, thresholds.avgResponseTimeThreshold);
  const errorStatus = getStatus(currentMetrics.errorRate, thresholds.errorRateThreshold, true);

  const overallPass = p95Status.status === 'pass' && avgStatus.status === 'pass' && errorStatus.status === 'pass';
  const hasWarning = p95Status.status === 'warning' || avgStatus.status === 'warning' || errorStatus.status === 'warning';

  const getEnvironmentBadge = () => {
    const envConfig = {
      dev: { label: '🔧 Dev', color: 'bg-blue-600' },
      staging: { label: '⚡ Staging', color: 'bg-purple-600' },
      prod: { label: '🔥 Production', color: 'bg-red-600' },
    };
    const config = envConfig[baseline.environment];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Threshold Comparison</CardTitle>
            <CardDescription>
              Baseline: {baseline.vus} VUs for {baseline.duration}s • Margin: +{thresholds.margin}%
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getEnvironmentBadge()}
            {overallPass ? (
              <Badge className="bg-green-600">All Passed</Badge>
            ) : hasWarning ? (
              <Badge className="bg-yellow-600">Warning</Badge>
            ) : (
              <Badge className="bg-red-600">Failed</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Baseline</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">P95 Response Time</TableCell>
              <TableCell>{baseline.p95.toFixed(2)}ms</TableCell>
              <TableCell className="font-mono text-blue-600">
                {thresholds.p95Threshold}ms
              </TableCell>
              <TableCell className="font-bold">
                {currentMetrics.p95ResponseTime.toFixed(2)}ms
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <p95Status.icon className={`size-5 ${p95Status.color}`} />
                  <span className={p95Status.color}>{p95Status.status.toUpperCase()}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress 
                    value={(currentMetrics.p95ResponseTime / thresholds.p95Threshold) * 100}
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {((currentMetrics.p95ResponseTime / thresholds.p95Threshold) * 100).toFixed(1)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Avg Response Time</TableCell>
              <TableCell>{baseline.avgResponseTime.toFixed(2)}ms</TableCell>
              <TableCell className="font-mono text-blue-600">
                {thresholds.avgResponseTimeThreshold}ms
              </TableCell>
              <TableCell className="font-bold">
                {currentMetrics.avgResponseTime.toFixed(2)}ms
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <avgStatus.icon className={`size-5 ${avgStatus.color}`} />
                  <span className={avgStatus.color}>{avgStatus.status.toUpperCase()}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress 
                    value={(currentMetrics.avgResponseTime / thresholds.avgResponseTimeThreshold) * 100}
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {((currentMetrics.avgResponseTime / thresholds.avgResponseTimeThreshold) * 100).toFixed(1)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Error Rate</TableCell>
              <TableCell>{baseline.errorRate.toFixed(2)}%</TableCell>
              <TableCell className="font-mono text-blue-600">
                {thresholds.errorRateThreshold}%
              </TableCell>
              <TableCell className="font-bold">
                {currentMetrics.errorRate.toFixed(2)}%
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <errorStatus.icon className={`size-5 ${errorStatus.color}`} />
                  <span className={errorStatus.color}>{errorStatus.status.toUpperCase()}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress 
                    value={(currentMetrics.errorRate / thresholds.errorRateThreshold) * 100}
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {((currentMetrics.errorRate / thresholds.errorRateThreshold) * 100).toFixed(1)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="mt-6 rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium mb-2">Threshold Calculation (Golden Rule)</h4>
          <div className="space-y-1 text-sm font-mono">
            <div>
              <span className="text-muted-foreground">P95:</span>{' '}
              <span>{baseline.p95}ms</span> × {(1 + thresholds.margin / 100).toFixed(2)} ={' '}
              <span className="text-blue-600 font-bold">{thresholds.p95Threshold}ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg:</span>{' '}
              <span>{baseline.avgResponseTime}ms</span> × {(1 + thresholds.margin / 100).toFixed(2)} ={' '}
              <span className="text-blue-600 font-bold">{thresholds.avgResponseTimeThreshold}ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">Error:</span>{' '}
              <span>{baseline.errorRate}%</span> × {(1 + thresholds.margin / 100).toFixed(2)} ={' '}
              <span className="text-blue-600 font-bold">{thresholds.errorRateThreshold}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
