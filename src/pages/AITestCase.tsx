import { useState } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { TestCaseInput } from '@/components/test-case-input';
import { ConfigPanel, TestCaseConfig } from '@/components/config-panel';
import { TestCaseResults } from '@/components/test-case-results';
import { generateTestCases, TestCase } from '@/components/test-case-generator';
import { generateTestCases as generateTestCasesAPI, generateTestCasesWithFile } from '@/lib/api';
import { toast } from 'sonner';

export default function AITestCase() {
  const [config, setConfig] = useState<TestCaseConfig>({
    testType: 'functional',
    coverage: 70,
    includeNegative: true,
    includeEdgeCases: true,
    includePerformance: false,
    priority: 'all'
  });

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [sourceInfo, setSourceInfo] = useState<{ type: string; metadata?: any; content?: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputSubmit = async (data: { type: 'jira' | 'manual', content: string, metadata?: any, file?: File }) => {
    setIsGenerating(true);
    toast.loading('Sending data to N8N webhook...', { id: 'generating' });

    try {
      let response;
      
      // If there's a file, use the file upload endpoint
      if (data.file) {
        response = await generateTestCasesWithFile(data.file, data.type, data.metadata);
      } else {
        // Otherwise, send the text content
        response = await generateTestCasesAPI({
          type: data.type,
          content: data.content,
          metadata: data.metadata
        });
      }

      // For now, still generate mock test cases locally
      // The webhook response will be logged and can be processed later
      console.log('N8N Webhook Response:', response);
      
      const generated = generateTestCases(data, config);
      setTestCases(generated);
      setSourceInfo({ ...data, content: data.content });
      setIsGenerating(false);
      toast.success(`Data sent to webhook! Generated ${generated.length} test cases!`, { id: 'generating' });
    } catch (error: any) {
      console.error('Error calling webhook:', error);
      setIsGenerating(false);
      toast.error(`Error: ${error.message}`, { id: 'generating' });
      
      // Fallback to local generation
      const generated = generateTestCases(data, config);
      setTestCases(generated);
      setSourceInfo({ ...data, content: data.content });
      toast.info(`Fallback: Generated ${generated.length} test cases locally`, { duration: 3000 });
    }
  };
  
  const handleRegenerate = () => {
    if (!sourceInfo) return;
    
    setIsGenerating(true);
    toast.loading('Regenerating test cases with new variations...', { id: 'regenerating' });

    // Simulate AI processing delay
    setTimeout(() => {
      const regenerated = generateTestCases(
        { type: sourceInfo.type as 'jira' | 'manual', content: sourceInfo.content || '', metadata: sourceInfo.metadata },
        config,
        [],
        false
      );
      setTestCases(regenerated);
      setIsGenerating(false);
      toast.success(`Regenerated ${regenerated.length} test cases!`, { id: 'regenerating' });
    }, 1500);
  };
  
  const handleGenerateMore = () => {
    if (!sourceInfo) return;
    
    setIsGenerating(true);
    toast.loading('Generating additional test cases...', { id: 'generating-more' });

    // Simulate AI processing delay
    setTimeout(() => {
      const additional = generateTestCases(
        { type: sourceInfo.type as 'jira' | 'manual', content: sourceInfo.content || '', metadata: sourceInfo.metadata },
        config,
        testCases,
        true
      );
      setTestCases([...testCases, ...additional]);
      setIsGenerating(false);
      toast.success(`Added ${additional.length} more test cases!`, { id: 'generating-more' });
    }, 1500);
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
          Generate comprehensive test cases from JIRA stories or PRD documents using AI
        </p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-6">
          <TestCaseInput onInputSubmit={handleInputSubmit} isLoading={isGenerating} />
          
          {testCases.length > 0 && (
            <TestCaseResults 
              testCases={testCases} 
              sourceInfo={sourceInfo || undefined}
              onRegenerate={handleRegenerate}
              onGenerateMore={handleGenerateMore}
            />
          )}
        </div>

        {/* Right Column - Configuration */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            <ConfigPanel config={config} onConfigChange={setConfig} />
            
            {/* Stats Card */}
            {testCases.length > 0 && (
              <div className="p-4 bg-card rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="size-4 text-muted-foreground" />
                  <h3 className="font-medium">Generation Stats</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cases:</span>
                    <span className="font-medium">{testCases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Critical:</span>
                    <span className="font-medium text-red-600">
                      {testCases.filter(tc => tc.priority === 'Critical').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">High:</span>
                    <span className="font-medium text-orange-600">
                      {testCases.filter(tc => tc.priority === 'High').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medium:</span>
                    <span className="font-medium text-yellow-600">
                      {testCases.filter(tc => tc.priority === 'Medium').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Low:</span>
                    <span className="font-medium text-blue-600">
                      {testCases.filter(tc => tc.priority === 'Low').length}
                    </span>
                  </div>
                </div>
              </div>
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
            Enter your JIRA story or upload a PRD document, configure your preferences, 
            and let AI generate comprehensive test cases for you.
          </p>
        </div>
      )}
    </div>
  );
}
