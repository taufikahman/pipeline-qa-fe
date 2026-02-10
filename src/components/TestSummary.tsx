import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestConfig } from './TestConfigForm';
import { K6Metrics } from './MetricsOverview';

interface TestSummaryProps {
  config: TestConfig | null;
  metrics: K6Metrics | null;
  startTime: string | null;
  duration: number;
}

export function TestSummary({ config, metrics, startTime, duration }: TestSummaryProps) {
  if (!config || !metrics) {
    return null;
  }

  const getStatusBadge = () => {
    if (metrics.errorRate < 1) {
      return <Badge className="bg-green-600">Excellent</Badge>;
    } else if (metrics.errorRate < 5) {
      return <Badge className="bg-yellow-600">Warning</Badge>;
    } else {
      return <Badge className="bg-red-600">Critical</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Summary</CardTitle>
            <CardDescription>
              {startTime && `Started at ${startTime} • Duration: ${duration}s`}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="w-full">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div>
              <h4 className="mb-2 font-medium">Request Details</h4>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Method</TableCell>
                    <TableCell>
                      <Badge variant="outline">{config.method}</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Endpoint</TableCell>
                    <TableCell className="font-mono text-sm break-all">{config.endpoint}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">URL Parameters</TableCell>
                    <TableCell className="font-mono text-sm break-all">
                      {config.urlParams || 'None'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Full URL</TableCell>
                    <TableCell className="font-mono text-sm break-all text-blue-600">
                      {config.endpoint}{config.urlParams}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {config.headers && Object.keys(config.headers).length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">Headers</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Header</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(config.headers).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell className="font-mono text-sm">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {config.payload && (
              <div>
                <h4 className="mb-2 font-medium">Request Body</h4>
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {config.payload}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <div>
              <h4 className="mb-2 font-medium">Performance Metrics</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Requests</TableCell>
                    <TableCell>{metrics.totalRequests.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Requests per Second</TableCell>
                    <TableCell>{metrics.requestsPerSecond.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Avg Response Time</TableCell>
                    <TableCell>{metrics.avgResponseTime.toFixed(2)}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Min Response Time</TableCell>
                    <TableCell>{metrics.minResponseTime}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Max Response Time</TableCell>
                    <TableCell>{metrics.maxResponseTime}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>P95 Response Time</TableCell>
                    <TableCell>{metrics.p95ResponseTime.toFixed(2)}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>P99 Response Time</TableCell>
                    <TableCell>{metrics.p99ResponseTime.toFixed(2)}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Success Rate</TableCell>
                    <TableCell className="text-green-600">
                      {metrics.successRate.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Error Rate</TableCell>
                    <TableCell className={metrics.errorRate > 5 ? 'text-red-600' : ''}>
                      {metrics.errorRate.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
