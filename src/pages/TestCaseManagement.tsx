import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, MoreHorizontal, X, Trash2, Edit3, Copy,
  FolderOpen, FolderClosed, CheckCircle, Clock, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Settings2, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  getSuites, createSuite, deleteSuite,
  getTestCases, createTestCase, updateTestCase, deleteTestCase,
  getDrafts, approveDraft,
  type TestSuite, type ManagedTestCase, type TestCaseDraft
} from '@/lib/api';
import { toast } from 'sonner';

/* ── Priority icon helper (colored arrows like Qase) ──────────────────── */

function PriorityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'CRITICAL':
      return <ChevronsUp className="size-4 text-red-500" />;
    case 'HIGH':
      return <ArrowUp className="size-4 text-orange-500" />;
    case 'MEDIUM':
      return <ArrowUp className="size-4 text-yellow-500" />;
    case 'LOW':
      return <ArrowDown className="size-4 text-blue-500" />;
    default:
      return <ArrowUp className="size-4 text-gray-400" />;
  }
}

/* ── Behavior / severity badge colours ─────────────────────────────────── */

const severityBadge: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white border-transparent',
  HIGH: 'bg-orange-500 text-white border-transparent',
  MEDIUM: 'bg-yellow-500 text-white border-transparent',
  LOW: 'bg-blue-500 text-white border-transparent',
};

const behaviorBadge: Record<string, string> = {
  POSITIVE: 'bg-green-600 text-white border-transparent',
  NEGATIVE: 'bg-purple-600 text-white border-transparent',
  EDGE_CASE: 'bg-indigo-600 text-white border-transparent',
  PERFORMANCE: 'bg-pink-600 text-white border-transparent',
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function TestCaseManagement() {
  /* ── state ── */
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<number>>(new Set());
  const [showNewSuiteDialog, setShowNewSuiteDialog] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');

  const [testCases, setTestCases] = useState<ManagedTestCase[]>([]);
  const [allTestCases, setAllTestCases] = useState<ManagedTestCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ManagedTestCase | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<number>>(new Set());

  const [drafts, setDrafts] = useState<TestCaseDraft[]>([]);

  // Quick‑test inline
  const [quickTestTitle, setQuickTestTitle] = useState('');
  const [showQuickTest, setShowQuickTest] = useState(false);

  // Case form fields
  const [cfTitle, setCfTitle] = useState('');
  const [cfType, setCfType] = useState('MANUAL');
  const [cfBehavior, setCfBehavior] = useState('POSITIVE');
  const [cfSeverity, setCfSeverity] = useState('MEDIUM');
  const [cfDescription, setCfDescription] = useState('');
  const [cfPreConditions, setCfPreConditions] = useState('');
  const [cfPostConditions, setCfPostConditions] = useState('');
  const [cfAssignedTo, setCfAssignedTo] = useState('');
  const [cfComponent, setCfComponent] = useState('');
  const [cfSteps, setCfSteps] = useState<Array<{ action: string; expected: string }>>([{ action: '', expected: '' }]);

  // Detail
  const [isEditing, setIsEditing] = useState(false);
  const [detailTab, setDetailTab] = useState<string>('general');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);

  /* ── helpers: suite case count ── */
  const suiteCaseCounts: Record<number, number> = {};
  allTestCases.forEach(tc => {
    suiteCaseCounts[tc.suite_id] = (suiteCaseCounts[tc.suite_id] || 0) + 1;
  });

  const totalCases = allTestCases.length;

  /* ── Load suites ── */
  const loadSuites = useCallback(async () => {
    try {
      const res = await getSuites();
      setSuites(res.data);
    } catch (err: any) { toast.error(err.message); }
  }, []);

  /* ── Load test cases for a suite ── */
  const loadTestCases = useCallback(async (suiteId: number) => {
    setLoading(true);
    try {
      const res = await getTestCases(suiteId);
      setTestCases(res.data);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  /* ── Load ALL test cases (for counts) ── */
  const loadAllTestCases = useCallback(async () => {
    try {
      const res = await getTestCases();
      setAllTestCases(res.data);
    } catch { /* silent */ }
  }, []);

  /* ── Load drafts ── */
  const loadDrafts = useCallback(async () => {
    try {
      const res = await getDrafts('PENDING');
      setDrafts(res.data);
    } catch (err: any) { toast.error(err.message); }
  }, []);

  useEffect(() => { loadSuites(); loadDrafts(); loadAllTestCases(); }, [loadSuites, loadDrafts, loadAllTestCases]);

  useEffect(() => {
    if (selectedSuite) {
      loadTestCases(selectedSuite.id);
      setSelectedCase(null);
      setSelectedCaseIds(new Set());
      setExpandedSuites(prev => new Set([...prev, selectedSuite.id]));
    }
  }, [selectedSuite, loadTestCases]);

  /* ── Suite CRUD ── */
  const handleCreateSuite = async () => {
    if (!newSuiteName.trim()) return;
    try {
      await createSuite({ name: newSuiteName.trim(), description: newSuiteDesc || undefined });
      setShowNewSuiteDialog(false); setNewSuiteName(''); setNewSuiteDesc('');
      loadSuites(); toast.success('Suite created');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteSuite = async (id: number) => {
    if (!confirm('Delete this suite and all its test cases?')) return;
    try {
      await deleteSuite(id);
      if (selectedSuite?.id === id) { setSelectedSuite(null); setTestCases([]); setSelectedCase(null); }
      loadSuites(); loadAllTestCases(); toast.success('Suite deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  /* ── Test Case CRUD ── */
  const resetCaseForm = () => {
    setCfTitle(''); setCfType('MANUAL'); setCfBehavior('POSITIVE'); setCfSeverity('MEDIUM');
    setCfDescription(''); setCfPreConditions(''); setCfPostConditions('');
    setCfAssignedTo(''); setCfComponent(''); setCfSteps([{ action: '', expected: '' }]);
  };

  const handleCreateCase = async () => {
    if (!cfTitle.trim() || !selectedSuite) return;
    try {
      await createTestCase({
        suite_id: selectedSuite.id, title: cfTitle.trim(), type: cfType as any,
        behavior: cfBehavior as any, severity: cfSeverity as any,
        description: cfDescription || null, pre_conditions: cfPreConditions || null,
        post_conditions: cfPostConditions || null, steps: cfSteps.filter(s => s.action.trim()),
        assigned_to: cfAssignedTo || null, component: cfComponent || null,
      });
      setShowNewCaseDialog(false); resetCaseForm();
      loadTestCases(selectedSuite.id); loadAllTestCases(); toast.success('Test case created');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleQuickTest = async () => {
    if (!quickTestTitle.trim() || !selectedSuite) return;
    try {
      await createTestCase({ suite_id: selectedSuite.id, title: quickTestTitle.trim() });
      setQuickTestTitle(''); setShowQuickTest(false);
      loadTestCases(selectedSuite.id); loadAllTestCases(); toast.success('Test case created');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateCase = async () => {
    if (!selectedCase) return;
    try {
      const res = await updateTestCase(selectedCase.id, selectedCase);
      setSelectedCase(res.data); setIsEditing(false);
      if (selectedSuite) loadTestCases(selectedSuite.id);
      toast.success('Test case updated');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteCase = async (id: number) => {
    if (!confirm('Delete this test case?')) return;
    try {
      await deleteTestCase(id);
      if (selectedCase?.id === id) setSelectedCase(null);
      if (selectedSuite) loadTestCases(selectedSuite.id);
      loadAllTestCases(); toast.success('Test case deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteSelected = async () => {
    if (selectedCaseIds.size === 0) return;
    if (!confirm(`Delete ${selectedCaseIds.size} test case(s)?`)) return;
    try {
      for (const id of selectedCaseIds) await deleteTestCase(id);
      setSelectedCaseIds(new Set());
      if (selectedCase && selectedCaseIds.has(selectedCase.id)) setSelectedCase(null);
      if (selectedSuite) loadTestCases(selectedSuite.id);
      loadAllTestCases(); toast.success('Deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  /* ── Draft approve ── */
  const handleApproveDraft = async (draft: TestCaseDraft) => {
    try {
      const res = await approveDraft(draft.id, draft.target_suite_id || undefined);
      toast.success(res.message); loadDrafts(); loadSuites(); loadAllTestCases();
      if (selectedSuite) loadTestCases(selectedSuite.id);
    } catch (err: any) { toast.error(err.message); }
  };

  /* ── Steps form helpers ── */
  const addStep = () => setCfSteps(p => [...p, { action: '', expected: '' }]);
  const removeStep = (i: number) => setCfSteps(p => p.filter((_, idx) => idx !== i));
  const updateStep = (i: number, f: 'action' | 'expected', v: string) => setCfSteps(p => p.map((s, idx) => idx === i ? { ...s, [f]: v } : s));

  const addDetailStep = () => { if (!selectedCase) return; setSelectedCase({ ...selectedCase, steps: [...(selectedCase.steps || []), { action: '', expected: '' }] }); };
  const removeDetailStep = (i: number) => { if (!selectedCase) return; setSelectedCase({ ...selectedCase, steps: selectedCase.steps.filter((_, idx) => idx !== i) }); };
  const updateDetailStep = (i: number, f: 'action' | 'expected', v: string) => {
    if (!selectedCase) return;
    setSelectedCase({ ...selectedCase, steps: selectedCase.steps.map((s, idx) => idx === i ? { ...s, [f]: v } : s) });
  };

  /* ── Step expand toggle ── */
  const toggleStepExpand = (idx: number) => {
    const n = new Set(expandedSteps);
    n.has(idx) ? n.delete(idx) : n.add(idx);
    setExpandedSteps(n);
  };

  /* ── Filtering ── */
  const filteredCases = testCases.filter(tc => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return tc.title.toLowerCase().includes(q) || (tc.tc_id || '').toLowerCase().includes(q);
  });

  /* ── Suite expand / collapse ── */
  const toggleSuiteExpand = (id: number) => {
    const n = new Set(expandedSuites);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpandedSuites(n);
  };

  const expandAllSuites = () => setExpandedSuites(new Set(suites.map(s => s.id)));
  const collapseAllSuites = () => setExpandedSuites(new Set());

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="-m-6">
      {/* Pending drafts banner */}
      {drafts.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-4 text-amber-600" />
            <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">
              {drafts.length} Pending Draft{drafts.length !== 1 ? 's' : ''} — Review & approve to add to repository
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {drafts.map(d => (
              <div key={d.id} className="inline-flex items-center gap-3 bg-white dark:bg-gray-900 rounded-md px-3 py-2 border text-sm">
                <span className="font-medium truncate max-w-[200px]">{d.title}</span>
                <span className="text-muted-foreground text-xs">{d.test_cases_data.length} cases</span>
                <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => handleApproveDraft(d)}>
                  <CheckCircle className="size-3.5 mr-1" /> Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top header bar */}
      <div className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Repository</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalCases} case{totalCases !== 1 ? 's' : ''} ({totalCases}) | {suites.length} suite{suites.length !== 1 ? 's' : ''} ({suites.length})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="By all fields" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">By all fields</SelectItem>
              <SelectItem value="title">By title</SelectItem>
              <SelectItem value="id">By ID</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400 text-xs px-0">
            Add filter
          </Button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex" style={{ height: 'calc(100vh - 210px)' }}>

        {/* ── Panel 1: Suites ── */}
        <div className="w-64 border-r flex flex-col shrink-0 bg-background">
          {/* Suites header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-1.5">
              <FolderClosed className="size-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Suites</span>
              <Button variant="ghost" size="icon" className="size-6 ml-0.5" onClick={() => setShowNewSuiteDialog(true)}>
                <Plus className="size-3.5" />
              </Button>
            </div>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="size-6" title="Expand all" onClick={expandAllSuites}>
                <ChevronsDown className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" title="Collapse all" onClick={collapseAllSuites}>
                <ChevronsUp className="size-3.5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="py-1">
              {suites.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-10">
                  <FolderOpen className="size-10 mx-auto mb-2 opacity-30" />
                  <p>No suites yet</p>
                  <Button variant="link" size="sm" className="text-xs mt-1" onClick={() => setShowNewSuiteDialog(true)}>
                    Create your first suite
                  </Button>
                </div>
              )}
              {suites.map(suite => {
                const count = suiteCaseCounts[suite.id] || 0;
                const isExpanded = expandedSuites.has(suite.id);
                const isSelected = selectedSuite?.id === suite.id;

                return (
                  <div key={suite.id}>
                    <div
                      className={`flex items-center gap-1 px-3 py-2 cursor-pointer group text-sm transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'hover:bg-muted/60'
                      }`}
                      onClick={() => { setSelectedSuite(suite); }}
                    >
                      <button
                        className="shrink-0 p-0.5 hover:bg-muted rounded"
                        onClick={e => { e.stopPropagation(); toggleSuiteExpand(suite.id); }}
                      >
                        {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </button>
                      <FolderClosed className={`size-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <span className="truncate flex-1 font-medium">{suite.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded shrink-0">
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleDeleteSuite(suite.id)} className="text-red-600">
                            <Trash2 className="size-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── Panel 2: Test Cases ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {!selectedSuite ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <FolderOpen className="size-16 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a suite to view test cases</p>
              <p className="text-xs mt-1 opacity-70">Choose a suite from the left panel</p>
            </div>
          ) : (
            <>
              {/* Suite header */}
              <div className="px-5 pt-4 pb-3 border-b">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold">{selectedSuite.name}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => { resetCaseForm(); setShowNewCaseDialog(true); }}>
                        <Plus className="size-3.5 mr-2" /> Add test case
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteSuite(selectedSuite.id)} className="text-red-600">
                        <Trash2 className="size-3.5 mr-2" /> Delete suite
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {selectedSuite.description && (
                  <p className="text-sm text-muted-foreground">{selectedSuite.description}</p>
                )}
              </div>

              {/* Select all bar */}
              <div className="flex items-center gap-3 px-5 py-2 border-b bg-muted/30 text-sm">
                <Checkbox
                  checked={filteredCases.length > 0 && selectedCaseIds.size === filteredCases.length}
                  onCheckedChange={checked => {
                    if (checked) setSelectedCaseIds(new Set(filteredCases.map(tc => tc.id)));
                    else setSelectedCaseIds(new Set());
                  }}
                />
                <span className="text-muted-foreground text-xs">Select all</span>
                {selectedCaseIds.size > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{selectedCaseIds.size} selected</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={handleDeleteSelected}>
                      <Trash2 className="size-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Test case rows */}
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="size-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div>
                    {filteredCases.map(tc => {
                      const isSelected = selectedCase?.id === tc.id;
                      return (
                        <div
                          key={tc.id}
                          onClick={() => { setSelectedCase(tc); setIsEditing(false); setDetailTab('general'); setExpandedSteps(new Set([0])); }}
                          className={`flex items-center gap-3 px-5 py-2.5 border-b cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-muted/40'
                          }`}
                        >
                          <div onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedCaseIds.has(tc.id)}
                              onCheckedChange={() => {
                                const s = new Set(selectedCaseIds);
                                s.has(tc.id) ? s.delete(tc.id) : s.add(tc.id);
                                setSelectedCaseIds(s);
                              }}
                            />
                          </div>
                          <PriorityIcon severity={tc.severity} />
                          <Settings2 className="size-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{tc.tc_id}</span>
                          <span className="text-sm truncate">{tc.title}</span>
                        </div>
                      );
                    })}

                    {filteredCases.length === 0 && !loading && (
                      <div className="text-center py-16 text-muted-foreground">
                        <p className="text-sm">No test cases in this suite</p>
                      </div>
                    )}

                    {/* + Quick test */}
                    <div className="px-5 py-2 border-b">
                      {showQuickTest ? (
                        <div className="flex items-center gap-2">
                          <Input
                            autoFocus
                            placeholder="Test case title..."
                            value={quickTestTitle}
                            onChange={e => setQuickTestTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleQuickTest(); if (e.key === 'Escape') { setShowQuickTest(false); setQuickTestTitle(''); } }}
                            className="h-8 text-sm flex-1"
                          />
                          <Button size="sm" className="h-8" onClick={handleQuickTest} disabled={!quickTestTitle.trim()}>Add</Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowQuickTest(false); setQuickTestTitle(''); }}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={() => setShowQuickTest(true)}
                        >
                          <Plus className="size-4" />
                          Quick test
                        </button>
                      )}
                    </div>

                    {/* Sub-suites (other suites shown as folder rows) */}
                    {suites.filter(s => s.id !== selectedSuite.id).slice(0, 5).map(s => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-5 py-2.5 border-b cursor-pointer hover:bg-muted/40 text-sm"
                        onClick={() => setSelectedSuite(s)}
                      >
                        <MoreHorizontal className="size-3.5 text-muted-foreground opacity-0" />
                        <Checkbox className="opacity-0 pointer-events-none" />
                        <FolderClosed className="size-4 text-muted-foreground" />
                        <span className="truncate">{s.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        {/* ── Panel 3: Detail ── */}
        <div className={`border-l flex flex-col shrink-0 bg-background transition-all ${selectedCase ? 'w-[420px]' : 'w-0 overflow-hidden'}`}>
          {selectedCase && (
            <>
              {/* Detail header */}
              <div className="px-4 pt-4 pb-3 border-b">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-mono">{selectedCase.tc_id}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-7" title="Flip"><Copy className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setSelectedCase(null)}><X className="size-4" /></Button>
                  </div>
                </div>
                <h3 className="text-lg font-bold leading-tight mb-1">{selectedCase.title}</h3>
                {selectedSuite && (
                  <p className="text-xs text-muted-foreground">{selectedSuite.name}</p>
                )}

                {/* Action icons */}
                <div className="flex items-center gap-1 mt-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    title="Edit"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-8" title="Clone">
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-red-500 hover:text-red-700"
                    title="Delete"
                    onClick={() => handleDeleteCase(selectedCase.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mt-4 border-b -mx-4 px-4">
                  {['General', 'Properties', 'Runs', 'History', 'Defects', 'Comments'].map(tab => {
                    const key = tab.toLowerCase();
                    return (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(key)}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                          detailTab === key
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail body */}
              <ScrollArea className="flex-1">
                {detailTab === 'general' && (
                  <div className="p-4 space-y-5">
                    {isEditing && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); if (selectedSuite) loadTestCases(selectedSuite.id); }}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdateCase}>Save</Button>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Description</h4>
                      {isEditing ? (
                        <Textarea
                          value={selectedCase.description || ''}
                          onChange={e => setSelectedCase({ ...selectedCase, description: e.target.value })}
                          rows={3} className="text-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{selectedCase.description || 'Not set'}</p>
                      )}
                    </div>

                    {/* Pre-conditions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Pre-conditions</h4>
                      {isEditing ? (
                        <Textarea
                          value={selectedCase.pre_conditions || ''}
                          onChange={e => setSelectedCase({ ...selectedCase, pre_conditions: e.target.value })}
                          rows={2} className="text-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{selectedCase.pre_conditions || 'Not set'}</p>
                      )}
                    </div>

                    {/* Post-conditions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Post-conditions</h4>
                      {isEditing ? (
                        <Textarea
                          value={selectedCase.post_conditions || ''}
                          onChange={e => setSelectedCase({ ...selectedCase, post_conditions: e.target.value })}
                          rows={2} className="text-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{selectedCase.post_conditions || 'Not set'}</p>
                      )}
                    </div>

                    <Separator />

                    {/* Steps */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold">Steps</h4>
                        <div className="flex items-center gap-2">
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addDetailStep}>
                              <Plus className="size-3 mr-1" /> Add
                            </Button>
                          )}
                          <span className="text-xs text-muted-foreground">Shown as list</span>
                          {!isEditing && (
                            <Button variant="link" size="sm" className="h-6 text-xs text-blue-600 dark:text-blue-400 px-0" onClick={() => setIsEditing(true)}>
                              <Edit3 className="size-3 mr-1" /> Edit
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0">
                        {(selectedCase.steps || []).map((step, idx) => {
                          const isStepExpanded = expandedSteps.has(idx);
                          return (
                            <div key={idx} className="border-l-2 border-muted ml-3">
                              {/* Step action row */}
                              <div
                                className="flex items-start gap-2 py-2 pl-4 pr-2 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => !isEditing && toggleStepExpand(idx)}
                              >
                                <button className="shrink-0 mt-0.5" onClick={e => { e.stopPropagation(); toggleStepExpand(idx); }}>
                                  {isStepExpanded
                                    ? <ChevronDown className="size-3.5 text-muted-foreground" />
                                    : <ChevronRight className="size-3.5 text-muted-foreground" />
                                  }
                                </button>
                                <span className="flex items-center justify-center size-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0">
                                  {idx + 1}
                                </span>
                                {isEditing ? (
                                  <div className="flex-1 flex items-center gap-1">
                                    <Input
                                      value={step.action}
                                      onChange={e => updateDetailStep(idx, 'action', e.target.value)}
                                      className="h-7 text-sm flex-1"
                                      placeholder="Action..."
                                    />
                                    <Button variant="ghost" size="icon" className="size-6 text-red-500 shrink-0" onClick={() => removeDetailStep(idx)}>
                                      <X className="size-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-sm flex-1">{step.action}</p>
                                )}
                              </div>

                              {/* Expected result (expandable) */}
                              {isStepExpanded && (
                                <div className="pl-14 pr-4 pb-3">
                                  <span className="text-xs font-medium text-muted-foreground">Expected result</span>
                                  {isEditing ? (
                                    <Textarea
                                      value={step.expected}
                                      onChange={e => updateDetailStep(idx, 'expected', e.target.value)}
                                      rows={2} className="text-sm mt-1"
                                      placeholder="Expected result..."
                                    />
                                  ) : (
                                    <p className="text-sm mt-0.5">{step.expected || 'Not set'}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {(!selectedCase.steps || selectedCase.steps.length === 0) && !isEditing && (
                          <p className="text-sm text-muted-foreground pl-4">No steps defined.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'properties' && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        {isEditing ? (
                          <Select value={selectedCase.type} onValueChange={v => setSelectedCase({ ...selectedCase, type: v as any })}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MANUAL">Manual</SelectItem>
                              <SelectItem value="AUTOMATED">Automated</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm mt-1"><Badge variant="outline" className="text-xs">{selectedCase.type}</Badge></p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Behavior</Label>
                        {isEditing ? (
                          <Select value={selectedCase.behavior} onValueChange={v => setSelectedCase({ ...selectedCase, behavior: v as any })}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="POSITIVE">Positive</SelectItem>
                              <SelectItem value="NEGATIVE">Negative</SelectItem>
                              <SelectItem value="EDGE_CASE">Edge Case</SelectItem>
                              <SelectItem value="PERFORMANCE">Performance</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm mt-1"><Badge className={`text-xs ${behaviorBadge[selectedCase.behavior] || 'bg-gray-500 text-white'}`}>{selectedCase.behavior.replace('_', ' ')}</Badge></p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Severity</Label>
                        {isEditing ? (
                          <Select value={selectedCase.severity} onValueChange={v => setSelectedCase({ ...selectedCase, severity: v as any })}>
                            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="LOW">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm mt-1"><Badge className={`text-xs ${severityBadge[selectedCase.severity] || 'bg-gray-500 text-white'}`}>{selectedCase.severity}</Badge></p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Assigned QA</Label>
                        {isEditing ? (
                          <Input value={selectedCase.assigned_to || ''} onChange={e => setSelectedCase({ ...selectedCase, assigned_to: e.target.value })} className="h-8 text-sm mt-1" placeholder="QA name..." />
                        ) : (
                          <p className="text-sm mt-1">{selectedCase.assigned_to || 'Unassigned'}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Component</Label>
                        {isEditing ? (
                          <Input value={selectedCase.component || ''} onChange={e => setSelectedCase({ ...selectedCase, component: e.target.value })} className="h-8 text-sm mt-1" placeholder="Component..." />
                        ) : (
                          <p className="text-sm mt-1">{selectedCase.component || 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 justify-end pt-2">
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleUpdateCase}>Save</Button>
                      </div>
                    )}
                  </div>
                )}

                {detailTab !== 'general' && detailTab !== 'properties' && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Zap className="size-8 mb-2 opacity-30" />
                    <p className="text-sm">Coming soon</p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </div>

      {/* ── New Suite Dialog ── */}
      <Dialog open={showNewSuiteDialog} onOpenChange={setShowNewSuiteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Suite</DialogTitle>
            <DialogDescription>Add a new test suite to organize your test cases</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name <span className="text-red-500">*</span></Label>
              <Input value={newSuiteName} onChange={e => setNewSuiteName(e.target.value)} placeholder="Suite name" /></div>
            <div><Label>Description</Label>
              <Textarea value={newSuiteDesc} onChange={e => setNewSuiteDesc(e.target.value)} placeholder="Suite description (optional)" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSuiteDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSuite} disabled={!newSuiteName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Test Case Dialog ── */}
      <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
            <DialogDescription>Add a new test case to "{selectedSuite?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title <span className="text-red-500">*</span></Label>
              <Input value={cfTitle} onChange={e => setCfTitle(e.target.value)} placeholder="Test case title" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Type</Label>
                <Select value={cfType} onValueChange={setCfType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="MANUAL">Manual</SelectItem><SelectItem value="AUTOMATED">Automated</SelectItem></SelectContent>
                </Select></div>
              <div><Label>Behavior</Label>
                <Select value={cfBehavior} onValueChange={setCfBehavior}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="POSITIVE">Positive</SelectItem><SelectItem value="NEGATIVE">Negative</SelectItem><SelectItem value="EDGE_CASE">Edge Case</SelectItem><SelectItem value="PERFORMANCE">Performance</SelectItem></SelectContent>
                </Select></div>
              <div><Label>Severity</Label>
                <Select value={cfSeverity} onValueChange={setCfSeverity}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CRITICAL">Critical</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="LOW">Low</SelectItem></SelectContent>
                </Select></div>
            </div>
            <div><Label>Description</Label><Textarea value={cfDescription} onChange={e => setCfDescription(e.target.value)} placeholder="What does this test verify?" rows={2} /></div>
            <div><Label>Pre-conditions</Label><Input value={cfPreConditions} onChange={e => setCfPreConditions(e.target.value)} placeholder="Prerequisites..." /></div>
            <div><Label>Post-conditions</Label><Input value={cfPostConditions} onChange={e => setCfPostConditions(e.target.value)} placeholder="Expected state after test..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Assigned QA</Label><Input value={cfAssignedTo} onChange={e => setCfAssignedTo(e.target.value)} placeholder="QA name..." /></div>
              <div><Label>Component</Label><Input value={cfComponent} onChange={e => setCfComponent(e.target.value)} placeholder="e.g., Login" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Test Steps</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addStep}><Plus className="size-3 mr-1" /> Add Step</Button>
              </div>
              <div className="space-y-3">
                {cfSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="flex items-center justify-center size-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 mt-2">{idx + 1}</span>
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Action" value={step.action} onChange={e => updateStep(idx, 'action', e.target.value)} className="h-8 text-sm" />
                      <Input placeholder="Expected result" value={step.expected} onChange={e => updateStep(idx, 'expected', e.target.value)} className="h-8 text-sm" />
                    </div>
                    {cfSteps.length > 1 && (
                      <Button variant="ghost" size="icon" className="size-6 shrink-0 mt-2 text-red-500" onClick={() => removeStep(idx)}><X className="size-3.5" /></Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCaseDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCase} disabled={!cfTitle.trim()}>Create Test Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
