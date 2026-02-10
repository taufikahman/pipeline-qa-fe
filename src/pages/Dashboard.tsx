import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  Bug,
  Shield,
  Sparkles,
  BarChart3,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { usePipelineReports } from '@/hooks/usePipelineReports';

export default function Dashboard() {
  const { user, organizations } = useAuth();
  const { reports, isLoading } = usePipelineReports();

  const stats = useMemo(() => {
    if (!reports || reports.length === 0) {
      return {
        totalRuns: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        avgPassRate: 0,
        lastRun: null as Date | null,
        recentRuns: [] as typeof reports,
        passRateTrend: [] as number[],
        topFailingStages: [] as { name: string; failCount: number }[],
      };
    }

    const passed = reports.filter((r) => r.releaseStatus === 'passed').length;
    const failed = reports.filter((r) => r.releaseStatus === 'blocked').length;
    const pending = reports.filter((r) => r.releaseStatus === 'pending').length;
    const avgPassRate = Math.round(
      reports.reduce((sum, r) => sum + (r.passRate || 0), 0) / reports.length
    );

    // Count stage failures
    const stageFailMap: Record<string, number> = {};
    reports.forEach((r) => {
      r.stages?.forEach((s) => {
        if (s.status === 'failed') {
          stageFailMap[s.name] = (stageFailMap[s.name] || 0) + 1;
        }
      });
    });
    const topFailingStages = Object.entries(stageFailMap)
      .map(([name, failCount]) => ({ name, failCount }))
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 5);

    // Pass rate trend (last 10 runs, oldest first)
    const passRateTrend = reports
      .slice(0, 10)
      .reverse()
      .map((r) => r.passRate || 0);

    return {
      totalRuns: reports.length,
      passed,
      failed,
      pending,
      avgPassRate,
      lastRun: reports[0]?.runDate ? new Date(reports[0].runDate) : null,
      recentRuns: reports.slice(0, 5),
      passRateTrend,
      topFailingStages,
    };
  }, [reports]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {user?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your QA overview for{' '}
          <span className="font-medium text-foreground">
            {organizations?.[0]?.name || 'your organization'}
          </span>
          .
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                <p className="text-3xl font-bold">{stats.totalRuns}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                <Activity className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.passed}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <XCircle className="size-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Pass Rate</p>
                <p className="text-3xl font-bold">{stats.avgPassRate}%</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
                <TrendingUp className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pass Rate Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Pass Rate Trend
            </CardTitle>
            <CardDescription>Last {stats.passRateTrend.length} pipeline runs</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.passRateTrend.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end gap-1.5 h-32">
                  {stats.passRateTrend.map((rate, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{rate}%</span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          rate >= 80
                            ? 'bg-emerald-500'
                            : rate >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ height: `${Math.max(rate, 4)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-emerald-500" />
                    <span>&ge; 80%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-amber-500" />
                    <span>50-79%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-red-500" />
                    <span>&lt; 50%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Activity className="size-8 mb-2 opacity-40" />
                <p className="text-sm">No pipeline runs yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Failing Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="size-5" />
              Top Failing Stages
            </CardTitle>
            <CardDescription>Most frequently failing</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topFailingStages.length > 0 ? (
              <div className="space-y-3">
                {stats.topFailingStages.map((stage) => (
                  <div key={stage.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="size-4 text-red-500 shrink-0" />
                      <span className="text-sm truncate">{stage.name}</span>
                    </div>
                    <Badge variant="destructive" className="shrink-0 ml-2">
                      {stage.failCount} fail{stage.failCount > 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                <Shield className="size-8 mb-2 opacity-40" />
                <p className="text-sm">No failures recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Pipeline Runs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Recent Pipeline Runs
            </CardTitle>
            <CardDescription>Latest test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : stats.recentRuns.length > 0 ? (
              <div className="space-y-2">
                {stats.recentRuns.map((run) => {
                  const runDate = new Date(run.runDate);
                  const stagesPassed = run.stages?.filter((s) => s.status === 'passed').length ?? run.totalPassed ?? 0;
                  const stagesTotal = run.stages?.length || (
                    (run.totalPassed ?? 0) + (run.totalFailed ?? 0) + (run.totalPending ?? 0)
                  ) || 1;

                  return (
                    <div
                      key={run.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      {/* Status icon */}
                      <div className="shrink-0">
                        {run.releaseStatus === 'passed' ? (
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        ) : run.releaseStatus === 'blocked' ? (
                          <XCircle className="size-5 text-red-500" />
                        ) : (
                          <Clock className="size-5 text-amber-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Run #{run.id}</span>
                          <Badge
                            variant={
                              run.releaseStatus === 'passed'
                                ? 'default'
                                : run.releaseStatus === 'blocked'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-[10px] h-5"
                          >
                            {run.releaseStatus === 'passed'
                              ? 'Released'
                              : run.releaseStatus === 'blocked'
                                ? 'Blocked'
                                : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {runDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {stagesPassed}/{stagesTotal} stages passed
                        </p>
                      </div>

                      {/* Pass rate bar */}
                      <div className="w-20 shrink-0">
                        <div className="text-xs text-right font-medium mb-1">{run.passRate}%</div>
                        <Progress value={run.passRate} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="size-10 mb-3 opacity-30" />
                <p className="font-medium">No pipeline runs yet</p>
                <p className="text-sm">Run your first pipeline to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
              <Link to="/ai-testcase">
                <Sparkles className="size-4 mr-3 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">AI Test Case Builder</p>
                  <p className="text-xs text-muted-foreground">Generate test cases with AI</p>
                </div>
                <ArrowRight className="size-4 ml-auto opacity-50" />
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
              <Link to="/performance">
                <BarChart3 className="size-4 mr-3 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">API Performance</p>
                  <p className="text-xs text-muted-foreground">View k6 performance metrics</p>
                </div>
                <ArrowRight className="size-4 ml-auto opacity-50" />
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
              <Link to="/profile">
                <Shield className="size-4 mr-3 text-emerald-500" />
                <div className="text-left">
                  <p className="font-medium text-sm">Profile & Settings</p>
                  <p className="text-xs text-muted-foreground">Manage your account</p>
                </div>
                <ArrowRight className="size-4 ml-auto opacity-50" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Last run info */}
      {stats.lastRun && (
        <p className="text-xs text-muted-foreground text-center">
          Last pipeline run:{' '}
          {stats.lastRun.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
