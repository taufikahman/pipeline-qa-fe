import { useState, useEffect } from 'react';
import { CheckCircle2, Download, Copy, Filter, ChevronDown, ChevronUp, Save, CheckCheck, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { WebhookTestCase, saveDraft, approveDraft, getSuites, createSuite, type TestSuite as TSuite } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TestCaseResultsProps {
  testCases: WebhookTestCase[];
  generationId?: string;
  storyTitle?: string;
}

interface ManualTestCase {
  id: string;
  name: string;
  priority: string;
  labels: string;
  objective: string;
  precondition: string;
  steps: string;
  expectedResult: string;
  component: string;
}

export function TestCaseResults({ testCases, generationId, storyTitle }: TestCaseResultsProps) {
  const navigate = useNavigate();
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set(testCases.map(tc => tc.tc_number)));
  const [manualCases, setManualCases] = useState<ManualTestCase[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [suites, setSuites] = useState<TSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('new');
  const [newSuiteName, setNewSuiteName] = useState(storyTitle || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);

  // Manual form fields
  const [mfName, setMfName] = useState('');
  const [mfPriority, setMfPriority] = useState('Medium');
  const [mfLabels, setMfLabels] = useState('Positive');
  const [mfObjective, setMfObjective] = useState('');
  const [mfPrecondition, setMfPrecondition] = useState('');
  const [mfSteps, setMfSteps] = useState('');
  const [mfExpectedResult, setMfExpectedResult] = useState('');
  const [mfComponent, setMfComponent] = useState('');

  useEffect(() => {
    getSuites().then(res => setSuites(res.data)).catch(() => {});
  }, []);

  // Combine AI + manual cases for filtering
  const allCases: (WebhookTestCase | (ManualTestCase & { tc_number: string; status: string; operatingSystem: string }))[] = [
    ...testCases,
    ...manualCases.map(mc => ({ ...mc, tc_number: mc.id, status: 'Draft', operatingSystem: '' })),
  ];

  const filteredCases = allCases.filter(tc => {
    const priorityMatch = filterPriority === 'all' || tc.priority === filterPriority;
    const labelMatch = filterLabel === 'all' || tc.labels === filterLabel;
    return priorityMatch && labelMatch;
  });

  const uniqueLabels = [...new Set(allCases.map(tc => tc.labels))].filter(Boolean);

  const toggleExpanded = (tcNumber: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(tcNumber)) newExpanded.delete(tcNumber);
    else newExpanded.add(tcNumber);
    setExpandedCases(newExpanded);
  };

  const expandAll = () => setExpandedCases(new Set(filteredCases.map(tc => tc.tc_number)));
  const collapseAll = () => setExpandedCases(new Set());

  const toggleSelected = (tcNumber: string) => {
    const newSelected = new Set(selectedCases);
    if (newSelected.has(tcNumber)) newSelected.delete(tcNumber);
    else newSelected.add(tcNumber);
    setSelectedCases(newSelected);
  };

  const selectAll = () => setSelectedCases(new Set(allCases.map(tc => tc.tc_number)));
  const deselectAll = () => setSelectedCases(new Set());

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
    return steps.split('\n').map(s => s.trim()).filter(Boolean);
  };

  const exportToCSV = () => {
    const headers = ['TC Number', 'Name', 'Priority', 'Labels', 'Status', 'Objective', 'Precondition', 'Steps', 'Expected Result', 'Component'];
    const selectedFiltered = filteredCases.filter(tc => selectedCases.has(tc.tc_number));
    const rows = selectedFiltered.map(tc => [
      tc.tc_number,
      tc.name,
      tc.priority,
      tc.labels,
      tc.status,
      tc.objective,
      tc.precondition,
      (tc.steps || '').replace(/\n/g, ' | '),
      tc.expectedResult,
      tc.component,
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
    const selectedFiltered = filteredCases.filter(tc => selectedCases.has(tc.tc_number));
    const text = selectedFiltered.map(tc => {
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

  const addManualTestCase = () => {
    if (!mfName.trim()) { toast.error('Test case name is required'); return; }
    const newCase: ManualTestCase = {
      id: `MC-${String(manualCases.length + 1).padStart(3, '0')}`,
      name: mfName.trim(),
      priority: mfPriority,
      labels: mfLabels,
      objective: mfObjective,
      precondition: mfPrecondition,
      steps: mfSteps,
      expectedResult: mfExpectedResult,
      component: mfComponent,
    };
    setManualCases(prev => [...prev, newCase]);
    setSelectedCases(prev => new Set([...prev, newCase.id]));
    // Reset form
    setMfName(''); setMfObjective(''); setMfPrecondition(''); setMfSteps('');
    setMfExpectedResult(''); setMfComponent(''); setMfPriority('Medium'); setMfLabels('Positive');
    setShowManualForm(false);
    toast.success('Manual test case added');
  };

  const removeManualCase = (id: string) => {
    setManualCases(prev => prev.filter(mc => mc.id !== id));
    setSelectedCases(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const getSelectedTestCasesData = () => {
    return allCases.filter(tc => selectedCases.has(tc.tc_number));
  };

  const handleSaveDraft = async () => {
    const selected = getSelectedTestCasesData();
    if (selected.length === 0) { toast.error('Select at least one test case'); return; }
    setIsSaving(true);
    try {
      const res = await saveDraft({
        generation_id: generationId,
        title: storyTitle || `Draft ${new Date().toLocaleDateString()}`,
        test_cases_data: selected,
        summary: null,
      });
      setDraftId(res.data.id);
      toast.success(`Draft saved with ${selected.length} test cases`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    const selected = getSelectedTestCasesData();
    if (selected.length === 0) { toast.error('Select at least one test case'); return; }
    setIsApproving(true);
    try {
      let draftToApprove = draftId;

      // If no draft saved yet, save first
      if (!draftToApprove) {
        const draftRes = await saveDraft({
          generation_id: generationId,
          title: storyTitle || `Draft ${new Date().toLocaleDateString()}`,
          test_cases_data: selected,
          summary: null,
        });
        draftToApprove = draftRes.data.id;
      }

      let suiteId: number | undefined;
      if (selectedSuiteId !== 'new') {
        suiteId = parseInt(selectedSuiteId);
      } else if (newSuiteName.trim()) {
        const suiteRes = await createSuite({ name: newSuiteName.trim() });
        suiteId = suiteRes.data.id;
      }

      const res = await approveDraft(draftToApprove!, suiteId);
      toast.success(res.message);
      setShowApproveDialog(false);
      // Navigate to test case management
      navigate('/test-cases');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Generated Test Cases
              </CardTitle>
              <CardDescription>
                {selectedCases.size} of {allCases.length} selected
                {generationId && (
                  <span className="ml-2 font-mono text-xs opacity-60">({generationId})</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
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
          {/* Action Bar */}
          <div className="flex gap-2 flex-wrap pb-3 border-b">
            <Button variant="outline" size="sm" onClick={() => setShowManualForm(true)}>
              <Plus className="size-4 mr-1.5" />
              Add Manual Test Case
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving || selectedCases.size === 0}>
                <Save className="size-4 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button size="sm" onClick={() => setShowApproveDialog(true)} disabled={selectedCases.size === 0} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCheck className="size-4 mr-1.5" />
                Approve & Add ({selectedCases.size})
              </Button>
            </div>
          </div>

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
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">Select All</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs">Deselect All</Button>
              <span className="mx-1 border-l" />
              <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs">Expand All</Button>
              <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs">Collapse All</Button>
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
                const isSelected = selectedCases.has(tc.tc_number);
                const steps = parseSteps(tc.steps);
                const isManual = tc.tc_number.startsWith('MC-');

                return (
                  <div
                    key={tc.tc_number}
                    className={`border rounded-lg overflow-hidden transition-shadow ${isSelected ? 'ring-2 ring-blue-500/50 border-blue-500/30' : 'hover:shadow-md'}`}
                  >
                    <div className="flex items-start justify-between p-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelected(tc.tc_number)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpanded(tc.tc_number)}>
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
                            {isManual && (
                              <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800">
                                Manual
                              </Badge>
                            )}
                            {tc.component && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {tc.component}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-sm leading-snug">{tc.name}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isManual && (
                          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => removeManualCase(tc.tc_number)}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => toggleExpanded(tc.tc_number)}>
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t space-y-3 ml-10">
                        <div className="pt-3">
                          {tc.objective && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Objective</h5>
                              <p className="text-sm">{tc.objective}</p>
                            </div>
                          )}
                          {tc.precondition && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Precondition</h5>
                              <p className="text-sm">{tc.precondition}</p>
                            </div>
                          )}
                          {steps.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Steps</h5>
                              <ol className="list-decimal list-inside space-y-1">
                                {steps.map((step, idx) => (
                                  <li key={idx} className="text-sm text-foreground">{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {tc.expectedResult && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Expected Result</h5>
                              <p className="text-sm">{tc.expectedResult}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                            {tc.status && <span>Status: <span className="font-medium text-foreground">{tc.status}</span></span>}
                            {'operatingSystem' in tc && tc.operatingSystem && <span>OS: <span className="font-medium text-foreground">{tc.operatingSystem}</span></span>}
                            {tc.component && <span>Component: <span className="font-medium text-foreground">{tc.component}</span></span>}
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

      {/* Manual Test Case Dialog */}
      <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Manual Test Case</DialogTitle>
            <DialogDescription>Create a custom test case to add to the draft</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={mfName} onChange={e => setMfName(e.target.value)} placeholder="Test case name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={mfPriority} onValueChange={setMfPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label</Label>
                <Select value={mfLabels} onValueChange={setMfLabels}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Edge Case">Edge Case</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Objective</Label>
              <Textarea value={mfObjective} onChange={e => setMfObjective(e.target.value)} placeholder="What does this test verify?" rows={2} />
            </div>
            <div>
              <Label>Precondition</Label>
              <Input value={mfPrecondition} onChange={e => setMfPrecondition(e.target.value)} placeholder="Prerequisites..." />
            </div>
            <div>
              <Label>Steps (one per line)</Label>
              <Textarea value={mfSteps} onChange={e => setMfSteps(e.target.value)} placeholder="Step 1&#10;Step 2&#10;Step 3" rows={4} />
            </div>
            <div>
              <Label>Expected Result</Label>
              <Textarea value={mfExpectedResult} onChange={e => setMfExpectedResult(e.target.value)} placeholder="Expected outcome..." rows={2} />
            </div>
            <div>
              <Label>Component</Label>
              <Input value={mfComponent} onChange={e => setMfComponent(e.target.value)} placeholder="e.g., Login, Dashboard..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualForm(false)}>Cancel</Button>
            <Button onClick={addManualTestCase}>Add Test Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Add to Test Cases</DialogTitle>
            <DialogDescription>
              {selectedCases.size} test case{selectedCases.size !== 1 ? 's' : ''} will be added to the test case management.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Suite</Label>
              <Select value={selectedSuiteId} onValueChange={setSelectedSuiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a suite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Suite</SelectItem>
                  {suites.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSuiteId === 'new' && (
              <div>
                <Label>New Suite Name</Label>
                <Input value={newSuiteName} onChange={e => setNewSuiteName(e.target.value)} placeholder="Enter suite name..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isApproving || (selectedSuiteId === 'new' && !newSuiteName.trim())} className="bg-green-600 hover:bg-green-700 text-white">
              {isApproving ? 'Approving...' : `Approve ${selectedCases.size} Cases`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
