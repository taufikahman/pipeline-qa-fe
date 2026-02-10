import { useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestCaseInputProps {
  onInputSubmit: (data: { type: 'jira' | 'manual', content: string, metadata?: any, file?: File }) => void;
  isLoading?: boolean;
}

export function TestCaseInput({ onInputSubmit, isLoading = false }: TestCaseInputProps) {
  const [jiraStory, setJiraStory] = useState('');
  const [jiraKey, setJiraKey] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('jira');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // For PDF files, we don't read the content as text - just store the file
      if (file.type === 'application/pdf') {
        setManualInput(`[PDF File: ${file.name}]`);
      } else {
        // For text-based files, read the content
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setManualInput(content);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleJiraSubmit = () => {
    if (jiraStory.trim()) {
      onInputSubmit({
        type: 'jira',
        content: jiraStory,
        metadata: { jiraKey }
      });
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim() || uploadedFile) {
      onInputSubmit({
        type: 'manual',
        content: manualInput,
        metadata: { fileName: uploadedFile?.name },
        file: uploadedFile || undefined
      });
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setManualInput('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Story or PRD</CardTitle>
        <CardDescription>Configure JIRA story or upload/input your product requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jira">JIRA Story</TabsTrigger>
            <TabsTrigger value="manual">Manual Input / Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="jira" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jira-key">JIRA Story Key (Optional)</Label>
              <Input
                id="jira-key"
                placeholder="e.g., PROJ-123"
                value={jiraKey}
                onChange={(e) => setJiraKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jira-story">Story Description</Label>
              <Textarea
                id="jira-story"
                placeholder="As a user, I want to... so that..."
                rows={8}
                value={jiraStory}
                onChange={(e) => setJiraStory(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleJiraSubmit} 
              disabled={!jiraStory.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Test Cases'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload PRD Document</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {uploadedFile ? (
                  <div className="flex items-center justify-between bg-muted p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-blue-600" />
                      <span className="text-sm">{uploadedFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, TXT, MD, or DOC files
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-input">Or paste your story/PRD</Label>
              <Textarea
                id="manual-input"
                placeholder="Paste your product requirements document or user story here..."
                rows={8}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleManualSubmit} 
              disabled={(!manualInput.trim() && !uploadedFile) || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Test Cases'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
