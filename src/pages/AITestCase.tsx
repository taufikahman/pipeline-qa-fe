import { useState } from 'react';
import { Sparkles, Loader2, BarChart3, AlertTriangle, AlertCircle, Info, ArrowDown } from 'lucide-react';
import { TestCaseInput } from '@/components/test-case-input';
import { TestCaseResults } from '@/components/test-case-results';
import { generateTestCasesWebhook, WebhookTestCase, WebhookSummary } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AITestCase() {
  const [testCases, setTestCases] = useState<WebhookTestCase[]>([]);
  const [summary, setSummary] = useState<WebhookSummary | null>(null);
  const [generationId, setGenerationId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputSubmit = async (data: { type: 'jira' | 'manual', content: string, metadata?: any, file?: File, files?: File[] }) => {
    setIsGenerating(true);
    setTestCases([]);
    setSummary(null);
    setGenerationId('');
    toast.loading('Generating test cases... This may take a moment.', { id: 'generating' });

    try {
      const response = await generateTestCasesWebhook({
        title_story: data.metadata?.storyTitle || '',
        description_story: data.content,
        images: data.files
      });

      console.log('Webhook Response:', response);

      if (response.success && response.data) {
        const { generationId: genId, summary: sum, tc_data } = response.data;

        setGenerationId(genId || '');
        setSummary(sum || null);
        setTestCases(tc_data || []);
        setIsGenerating(false);

        const total = tc_data?.length || 0;
        toast.success(`Generated ${total} test cases!`, { id: 'generating' });
      } else {
        setIsGenerating(false);
        toast.error('Webhook returned unexpected response', { id: 'generating' });
      }
    } catch (error: any) {
      console.error('Error calling webhook:', error);
      setIsGenerating(false);
      toast.error(`Error: ${error.message}`, { id: 'generating' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="size-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Test Case Generator</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Generate comprehensive test cases from your story using AI
        </p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Input + Results */}
        <div className="lg:col-span-2 space-y-6">
          <TestCaseInput onInputSubmit={handleInputSubmit} isLoading={isGenerating} />

          {/* Loading State */}
          {isGenerating && (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="size-16 rounded-full border-4 border-blue-200 dark:border-blue-900" />
                    <Loader2 className="size-16 animate-spin text-blue-600 absolute inset-0" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1">Generating Test Cases...</h3>
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing your story and creating comprehensive test cases.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This usually takes 15-30 seconds.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Results */}
          {!isGenerating && testCases.length > 0 && (
            <TestCaseResults 
              testCases={testCases} 
              generationId={generationId}
            />
          )}
        </div>

        {/* Right Column - Summary Stats */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            {/* Summary Card */}
            {summary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="size-4" />
                    Generation Summary
                  </CardTitle>
                  {generationId && (
                    <p className="text-xs font-mono text-muted-foreground">{generationId}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Total */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Total Cases</span>
                    <span className="text-2xl font-bold">{summary.total}</span>
                  </div>

                  {/* Priority Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-3.5 text-red-600" />
                        <span className="text-sm">Critical</span>
                      </div>
                      <span className="font-bold text-red-600">{summary.critical}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-3.5 text-orange-600" />
                        <span className="text-sm">High</span>
                      </div>
                      <span className="font-bold text-orange-600">{summary.high}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                      <div className="flex items-center gap-2">
                        <Info className="size-3.5 text-yellow-600" />
                        <span className="text-sm">Medium</span>
                      </div>
                      <span className="font-bold text-yellow-600">{summary.medium}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="size-3.5 text-blue-600" />
                        <span className="text-sm">Low</span>
                      </div>
                      <span className="font-bold text-blue-600">{summary.low}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading placeholder for stats */}
            {isGenerating && !summary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="size-4" />
                    Generation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-14 rounded-lg bg-muted animate-pulse" />
                    <div className="h-10 rounded-md bg-muted animate-pulse" />
                    <div className="h-10 rounded-md bg-muted animate-pulse" />
                    <div className="h-10 rounded-md bg-muted animate-pulse" />
                    <div className="h-10 rounded-md bg-muted animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {testCases.length === 0 && !isGenerating && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <Sparkles className="size-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-medium mb-2">Ready to Generate Test Cases</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter your story title and description, optionally attach images,
            and let AI generate comprehensive test cases for you.
          </p>
        </div>
      )}
    </div>
  );
}
