import { useState } from 'react';
import { CheckCircle2, Download, Copy, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WebhookTestCase } from '@/lib/api';
import { toast } from 'sonner';

interface TestCaseResultsProps {
  testCases: WebhookTestCase[];
  generationId?: string;
}

export function TestCaseResults({ testCases, generationId }: TestCaseResultsProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());

  const filteredCases = testCases.filter(tc => {
    const priorityMatch = filterPriority === 'all' || tc.priority === filterPriority;
    const labelMatch = filterLabel === 'all' || tc.labels === filterLabel;
    return priorityMatch && labelMatch;
  });

  // Get unique labels for filter
  const uniqueLabels = [...new Set(testCases.map(tc => tc.labels))].filter(Boolean);

  const toggleExpanded = (tcNumber: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(tcNumber)) {
      newExpanded.delete(tcNumber);
    } else {
      newExpanded.add(tcNumber);
    }
    setExpandedCases(newExpanded);
  };

  const expandAll = () => {
    setExpandedCases(new Set(filteredCases.map(tc => tc.tc_number)));
  };

  const collapseAll = () => {
    setExpandedCases(new Set());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Positive': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'Negative': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'Edge Case': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
      case 'Performance': return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const parseSteps = (steps: string): string[] => {
    if (!steps) return [];
    // Split by newline, filter out empty lines
    return steps.split('\n').map(s => s.trim()).filter(Boolean);
  };

  const exportToCSV = () => {
    const headers = ['TC Number', 'Name', 'Priority', 'Labels', 'Status', 'Objective', 'Precondition', 'Steps', 'Expected Result', 'Component', 'Operating System'];
    const rows = filteredCases.map(tc => [
      tc.tc_number,
      tc.name,
      tc.priority,
      tc.labels,
      tc.status,
      tc.objective,
      tc.precondition,
      tc.steps.replace(/\n/g, ' | '),
      tc.expectedResult,
      tc.component,
      tc.operatingSystem
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${generationId || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Test cases exported to CSV');
  };

  const copyToClipboard = () => {
    const text = filteredCases.map(tc => {
      const steps = parseSteps(tc.steps);
      return (
        `${tc.tc_number}: ${tc.name}\n` +
        `Priority: ${tc.priority} | Label: ${tc.labels} | Component: ${tc.component}\n` +
        `Objective: ${tc.objective}\n` +
        (tc.precondition ? `Precondition: ${tc.precondition}\n` : '') +
        `Steps:\n${steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}\n` +
        `Expected Result: ${tc.expectedResult}\n` +
        '\n---\n'
      );
    }).join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Test cases copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Generated Test Cases
            </CardTitle>
            <CardDescription>
              {filteredCases.length} of {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
              {generationId && (
                <span className="ml-2 font-mono text-xs opacity-60">({generationId})</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="size-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3 items-center pb-3 border-b">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLabel} onValueChange={setFilterLabel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Label" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labels</SelectItem>
              {uniqueLabels.map(label => (
                <SelectItem key={label} value={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs">
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs">
              Collapse All
            </Button>
          </div>
        </div>

        {/* Test Cases List */}
        <div className="space-y-3">
          {filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No test cases match the current filters
            </div>
          ) : (
            filteredCases.map((tc) => {
              const isExpanded = expandedCases.has(tc.tc_number);
              const steps = parseSteps(tc.steps);

              return (
                <div
                  key={tc.tc_number}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header - Always visible */}
                  <div
                    className="flex items-start justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpanded(tc.tc_number)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {tc.tc_number}
                        </span>
                        <Badge variant="outline" className={getPriorityColor(tc.priority)}>
                          {tc.priority}
                        </Badge>
                        <Badge variant="outline" className={getLabelColor(tc.labels)}>
                          {tc.labels}
                        </Badge>
                        {tc.component && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {tc.component}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-sm leading-snug">{tc.name}</h4>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 ml-2">
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>

                  {/* Card Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t space-y-3">
                      <div className="pt-3">
                        {/* Objective */}
                        {tc.objective && (
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                              Objective
                            </h5>
                            <p className="text-sm">{tc.objective}</p>
                          </div>
                        )}

                        {/* Precondition */}
                        {tc.precondition && (
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                              Precondition
                            </h5>
                            <p className="text-sm">{tc.precondition}</p>
                          </div>
                        )}

                        {/* Steps */}
                        {steps.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                              Steps
                            </h5>
                            <ol className="list-decimal list-inside space-y-1">
                              {steps.map((step, idx) => (
                                <li key={idx} className="text-sm text-foreground">{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Expected Result */}
                        {tc.expectedResult && (
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                              Expected Result
                            </h5>
                            <p className="text-sm">{tc.expectedResult}</p>
                          </div>
                        )}

                        {/* Footer meta */}
                        <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                          {tc.status && (
                            <span>Status: <span className="font-medium text-foreground">{tc.status}</span></span>
                          )}
                          {tc.operatingSystem && (
                            <span>OS: <span className="font-medium text-foreground">{tc.operatingSystem}</span></span>
                          )}
                          {tc.component && (
                            <span>Component: <span className="font-medium text-foreground">{tc.component}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
