import { useState } from 'react';
import { CheckCircle2, Download, Copy, Filter, ChevronDown, ChevronUp, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestCase } from './test-case-generator';
import { toast } from 'sonner';

interface TestCaseResultsProps {
  testCases: TestCase[];
  sourceInfo?: { type: string; metadata?: any };
  onRegenerate?: () => void;
  onGenerateMore?: () => void;
}

export function TestCaseResults({ testCases, sourceInfo, onRegenerate, onGenerateMore }: TestCaseResultsProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());

  const filteredCases = testCases.filter(tc => {
    const priorityMatch = filterPriority === 'all' || tc.priority === filterPriority;
    const typeMatch = filterType === 'all' || tc.type === filterType;
    return priorityMatch && typeMatch;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCases(newExpanded);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Positive': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'Negative': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'Edge Case': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
      case 'Performance': return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Priority', 'Type', 'Steps', 'Expected Result', 'Prerequisites'];
    const rows = filteredCases.map(tc => [
      tc.id,
      tc.title,
      tc.priority,
      tc.type,
      tc.steps.join(' | '),
      tc.expectedResult,
      tc.prerequisites || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Test cases exported to CSV');
  };

  const copyToClipboard = () => {
    const text = filteredCases.map(tc => 
      `${tc.id}: ${tc.title}\nPriority: ${tc.priority} | Type: ${tc.type}\n` +
      `Steps:\n${tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n` +
      `Expected Result: ${tc.expectedResult}\n` +
      (tc.prerequisites ? `Prerequisites: ${tc.prerequisites}\n` : '') +
      '\n---\n'
    ).join('\n');

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
              {filteredCases.length} test case{filteredCases.length !== 1 ? 's' : ''} generated
              {sourceInfo?.metadata?.jiraKey && ` for ${sourceInfo.metadata.jiraKey}`}
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
        {/* Generation Actions */}
        <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex-1">
            <p className="text-sm text-foreground mb-1">Need more test cases?</p>
            <p className="text-xs text-muted-foreground">Regenerate with different variations or add more to existing cases</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRegenerate}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950"
            >
              <RefreshCw className="size-4 mr-2" />
              Regenerate
            </Button>
            <Button 
              size="sm" 
              onClick={onGenerateMore}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="size-4 mr-2" />
              Generate More
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center pb-2 border-b">
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

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Positive">Positive</SelectItem>
              <SelectItem value="Negative">Negative</SelectItem>
              <SelectItem value="Edge Case">Edge Case</SelectItem>
              <SelectItem value="Performance">Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Test Cases */}
        <div className="space-y-3">
          {filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No test cases match the current filters
            </div>
          ) : (
            filteredCases.map((testCase) => {
              const isExpanded = expandedCases.has(testCase.id);
              return (
                <div
                  key={testCase.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpanded(testCase.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">{testCase.id}</span>
                        <Badge variant="outline" className={getPriorityColor(testCase.priority)}>
                          {testCase.priority}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(testCase.type)}>
                          {testCase.type}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{testCase.title}</h4>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {testCase.prerequisites && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Prerequisites:</h5>
                          <p className="text-sm text-muted-foreground">{testCase.prerequisites}</p>
                        </div>
                      )}
                      <div>
                        <h5 className="text-sm font-medium mb-1">Steps:</h5>
                        <ol className="list-decimal list-inside space-y-1">
                          {testCase.steps.map((step, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">Expected Result:</h5>
                        <p className="text-sm text-muted-foreground">{testCase.expectedResult}</p>
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
