import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MAX_IMAGES = 3;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

interface TestCaseInputProps {
  onInputSubmit: (data: { type: 'jira' | 'manual', content: string, metadata?: any, file?: File, files?: File[] }) => void;
  isLoading?: boolean;
}

export function TestCaseInput({ onInputSubmit, isLoading = false }: TestCaseInputProps) {
  const [jiraStory, setJiraStory] = useState('');
  const [jiraKey, setJiraKey] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('jira');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        continue; // Skip non-image files
      }
      validFiles.push(file);
    }

    const totalFiles = uploadedImages.length + validFiles.length;
    if (totalFiles > MAX_IMAGES) {
      const allowed = MAX_IMAGES - uploadedImages.length;
      setUploadedImages(prev => [...prev, ...validFiles.slice(0, allowed)]);
    } else {
      setUploadedImages(prev => [...prev, ...validFiles]);
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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
    let hasError = false;

    if (!storyTitle.trim()) {
      setTitleError('Story Title is required');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (!description.trim()) {
      setDescriptionError('Description is required');
      hasError = true;
    } else {
      setDescriptionError('');
    }

    if (hasError) return;

    onInputSubmit({
      type: 'manual',
      content: description,
      metadata: {
        storyTitle,
        imageCount: uploadedImages.length,
        imageNames: uploadedImages.map(f => f.name)
      },
      files: uploadedImages.length > 0 ? uploadedImages : undefined
    });
  };

  const isManualFormValid = storyTitle.trim() !== '' && description.trim() !== '';

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
            {/* Story Title - Required */}
            <div className="space-y-2">
              <Label htmlFor="story-title">
                Story Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="story-title"
                placeholder="Enter story title..."
                value={storyTitle}
                onChange={(e) => {
                  setStoryTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError('');
                }}
                className={titleError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {titleError && (
                <p className="text-sm text-red-500">{titleError}</p>
              )}
            </div>

            {/* Description - Required */}
            <div className="space-y-2">
              <Label htmlFor="story-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="story-description"
                placeholder="Describe the user story or requirements in detail..."
                rows={6}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) setDescriptionError('');
                }}
                className={descriptionError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {descriptionError && (
                <p className="text-sm text-red-500">{descriptionError}</p>
              )}
            </div>

            {/* Image Upload - Optional */}
            <div className="space-y-2">
              <Label>
                Attachments <span className="text-muted-foreground text-xs font-normal">(Optional - max {MAX_IMAGES} images)</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {/* Uploaded images preview */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2.5 rounded">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="size-4 text-blue-600 shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="shrink-0 h-7 w-7 p-0"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                {uploadedImages.length < MAX_IMAGES && (
                  <label htmlFor="image-upload" className="cursor-pointer block text-center py-3">
                    <Upload className="size-6 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload images
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, GIF, or WEBP ({uploadedImages.length}/{MAX_IMAGES})
                    </p>
                    <input
                      ref={fileInputRef}
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                )}

                {uploadedImages.length >= MAX_IMAGES && (
                  <p className="text-xs text-center text-muted-foreground py-1">
                    Maximum {MAX_IMAGES} images reached
                  </p>
                )}
              </div>
            </div>

            <Button 
              onClick={handleManualSubmit} 
              disabled={!isManualFormValid || isLoading}
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
