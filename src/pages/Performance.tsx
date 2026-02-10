import { useState } from 'react';
import { TestConfigForm, TestConfig } from '@/components/TestConfigForm';
import { MetricsOverview, K6Metrics } from '@/components/MetricsOverview';
import { PerformanceCharts, TimeSeriesData, ResponseDistribution } from '@/components/PerformanceCharts';
import { TestSummary } from '@/components/TestSummary';
import { BaselineConfig, BaselineMetrics, ThresholdConfig } from '@/components/BaselineConfig';
import { ThresholdComparison } from '@/components/ThresholdComparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';

// Mock function to generate realistic k6 test results
function generateMockTestResults(config: TestConfig): {
  metrics: K6Metrics;
  timeSeriesData: TimeSeriesData[];
  distributionData: ResponseDistribution[];
} {
  const totalRequests = Math.floor(Math.random() * 5000) + 10000;
  const duration = 60; // 60 seconds test
  const requestsPerSecond = totalRequests / duration;
  
  const avgResponseTime = Math.random() * 200 + 50;
  const minResponseTime = Math.max(10, avgResponseTime - Math.random() * 40);
  const maxResponseTime = avgResponseTime + Math.random() * 300;
  const p95ResponseTime = avgResponseTime + Math.random() * 100;
  const p99ResponseTime = p95ResponseTime + Math.random() * 50;
  
  const errorRate = Math.random() * 5;
  const successRate = 100 - errorRate;

  const metrics: K6Metrics = {
    totalRequests,
    requestsPerSecond,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    errorRate,
    successRate,
  };

  // Generate time series data
  const timeSeriesData: TimeSeriesData[] = [];
  const intervals = 20;
  for (let i = 0; i < intervals; i++) {
    const time = `${i * 3}s`;
    const responseTime = avgResponseTime + (Math.random() - 0.5) * 50;
    const requests = Math.floor(requestsPerSecond * 3) + Math.floor((Math.random() - 0.5) * 50);
    const errors = Math.floor(requests * (errorRate / 100));
    
    timeSeriesData.push({
      time,
      responseTime: Math.max(0, responseTime),
      requests,
      errors,
    });
  }

  // Generate distribution data
  const distributionData: ResponseDistribution[] = [
    { range: '0-50ms', count: Math.floor(totalRequests * 0.15) },
    { range: '50-100ms', count: Math.floor(totalRequests * 0.25) },
    { range: '100-150ms', count: Math.floor(totalRequests * 0.30) },
    { range: '150-200ms', count: Math.floor(totalRequests * 0.18) },
    { range: '200-300ms', count: Math.floor(totalRequests * 0.08) },
    { range: '300ms+', count: Math.floor(totalRequests * 0.04) },
  ];

  return { metrics, timeSeriesData, distributionData };
}

export default function Performance() {
  const [currentConfig, setCurrentConfig] = useState<TestConfig | null>(null);
  const [metrics, setMetrics] = useState<K6Metrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [distributionData, setDistributionData] = useState<ResponseDistribution[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration] = useState(60);
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);

  const handleRunTest = (config: TestConfig) => {
    setIsRunning(true);
    setCurrentConfig(config);
    setStartTime(new Date().toLocaleTimeString());

    // Simulate test execution delay
    setTimeout(() => {
      const results = generateMockTestResults(config);
      setMetrics(results.metrics);
      setTimeSeriesData(results.timeSeriesData);
      setDistributionData(results.distributionData);
      setIsRunning(false);
    }, 2000);
  };

  const handleSaveBaseline = (baselineMetrics: BaselineMetrics, thresholdConfig: ThresholdConfig) => {
    setBaseline(baselineMetrics);
    setThresholds(thresholdConfig);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="size-8 text-primary" />
          <h1 className="text-3xl font-bold">k6 API Performance Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Configure and monitor your API performance tests with baseline thresholds
        </p>
      </div>

      <Tabs defaultValue="test" className="space-y-6">
        <TabsList>
          <TabsTrigger value="test">Performance Test</TabsTrigger>
          <TabsTrigger value="baseline">Baseline & Thresholds</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <TestConfigForm onRunTest={handleRunTest} isRunning={isRunning} />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <MetricsOverview metrics={metrics} />
              
              {metrics && baseline && thresholds && (
                <ThresholdComparison
                  baseline={baseline}
                  thresholds={thresholds}
                  currentMetrics={metrics}
                />
              )}
              
              {metrics && (
                <>
                  <PerformanceCharts
                    timeSeriesData={timeSeriesData}
                    distributionData={distributionData}
                  />
                  
                  <TestSummary
                    config={currentConfig}
                    metrics={metrics}
                    startTime={startTime}
                    duration={duration}
                  />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="baseline">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <BaselineConfig onSaveBaseline={handleSaveBaseline} />
            </div>
            <div className="lg:col-span-2">
              {baseline && thresholds ? (
                <div className="space-y-6">
                  {metrics ? (
                    <ThresholdComparison
                      baseline={baseline}
                      thresholds={thresholds}
                      currentMetrics={metrics}
                    />
                  ) : (
                    <div className="rounded-lg border bg-card p-8 text-center">
                      <h3 className="text-lg font-medium mb-2">Baseline Configured</h3>
                      <p className="text-muted-foreground mb-4">
                        Run a performance test to compare against your baseline thresholds
                      </p>
                      <div className="inline-block rounded-lg bg-muted p-4 text-left">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-8">
                            <span className="text-muted-foreground">Environment:</span>
                            <span className="font-medium capitalize">{baseline.environment}</span>
                          </div>
                          <div className="flex justify-between gap-8">
                            <span className="text-muted-foreground">P95 Threshold:</span>
                            <span className="font-mono text-blue-600">{thresholds.p95Threshold}ms</span>
                          </div>
                          <div className="flex justify-between gap-8">
                            <span className="text-muted-foreground">Avg Threshold:</span>
                            <span className="font-mono text-blue-600">{thresholds.avgResponseTimeThreshold}ms</span>
                          </div>
                          <div className="flex justify-between gap-8">
                            <span className="text-muted-foreground">Error Threshold:</span>
                            <span className="font-mono text-blue-600">{thresholds.errorRateThreshold}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                  <h3 className="text-lg font-medium mb-2">No Baseline Configured</h3>
                  <p>Configure your baseline metrics to calculate performance thresholds</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
