import { Stage } from '@/types/pipeline';
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutputReportProps {
  stages: Stage[];
  releaseStatus: 'pending' | 'passed' | 'blocked';
}

export function OutputReport({ stages, releaseStatus }: OutputReportProps) {
  const hasRun = stages.some(s => s.status !== 'pending');
  
  if (!hasRun) return null;

  const passedCount = stages.filter(s => s.status === 'passed').length;
  const failedCount = stages.filter(s => s.status === 'failed').length;
  const pendingCount = stages.filter(s => s.status === 'pending').length;
  const totalCount = stages.length;
  const passRate = Math.round((passedCount / totalCount) * 100);

  const getStatusIcon = (status: Stage['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="text-success" size={16} />;
      case 'failed':
        return <XCircle className="text-destructive" size={16} />;
      default:
        return <Clock className="text-muted-foreground" size={16} />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Pipeline Report</h2>
          <p className="text-sm text-muted-foreground">Execution summary and results</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="text-success" size={16} />
            <span className="text-xs font-medium text-success uppercase tracking-wider">Passed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{passedCount}</p>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="text-destructive" size={16} />
            <span className="text-xs font-medium text-destructive uppercase tracking-wider">Failed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{failedCount}</p>
        </div>
        
        <div className="bg-muted border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-muted-foreground" size={16} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-primary" size={16} />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Pass Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{passRate}%</p>
        </div>
      </div>

      {/* Release Status */}
      <div className={cn(
        "rounded-xl p-4 mb-6 border",
        releaseStatus === 'passed' 
          ? "bg-success/10 border-success/20" 
          : "bg-destructive/10 border-destructive/20"
      )}>
        <div className="flex items-center gap-3">
          {releaseStatus === 'passed' ? (
            <CheckCircle2 className="text-success" size={24} />
          ) : (
            <AlertTriangle className="text-destructive" size={24} />
          )}
          <div>
            <p className="font-semibold text-foreground">
              {releaseStatus === 'passed' ? 'Release Ready' : 'Release Blocked'}
            </p>
            <p className="text-sm text-muted-foreground">
              {releaseStatus === 'passed' 
                ? 'All quality gates passed. Safe to deploy.' 
                : 'Quality gate failed. Review and fix issues before release.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Results Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Stage Results</h3>
        </div>
        <div className="divide-y divide-border">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                {getStatusIcon(stage.status)}
                <div>
                  <p className="font-medium text-foreground text-sm">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">{stage.type}</p>
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                stage.status === 'passed' && "bg-success/10 text-success",
                stage.status === 'failed' && "bg-destructive/10 text-destructive",
                stage.status === 'pending' && "bg-muted text-muted-foreground"
              )}>
                {stage.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
