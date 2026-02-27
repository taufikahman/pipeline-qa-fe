import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, ImageIcon, Trash2, ExternalLink, Search,
  Loader2, Copy, Check, ChevronLeft, ChevronRight, X, Tag, Clipboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  uploadScreenshots, getScreenshotHistory, deleteScreenshot,
  ScreenshotRecord,
} from '@/lib/api';

const MAX_FILES = 10;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

export default function Screenshots() {
  const { user } = useAuth();

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // History state
  const [history, setHistory] = useState<ScreenshotRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI helpers
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [previewImg, setPreviewImg] = useState<ScreenshotRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScreenshotRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadedResults, setUploadedResults] = useState<ScreenshotRecord[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchHistory = useCallback(async (p = 1, q = '') => {
    setLoadingHistory(true);
    try {
      const res = await getScreenshotHistory({ page: p, limit: 12, search: q });
      setHistory(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // --- File handling ---
  const generateFileName = (mime: string) => {
    const ext = mime === 'image/png' ? '.png'
      : mime === 'image/jpeg' || mime === 'image/jpg' ? '.jpg'
      : mime === 'image/gif' ? '.gif'
      : mime === 'image/webp' ? '.webp'
      : '.png';
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '-',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');
    return `screenshot-${ts}${ext}`;
  };

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
      .filter(f => ACCEPTED.includes(f.type))
      .map(f => {
        const isPasted = !f.name || f.name === 'image.png' || f.name === 'image.jpg' || f.name.startsWith('blob');
        if (isPasted) {
          return new File([f], generateFileName(f.type), { type: f.type });
        }
        return f;
      });
    setFiles(prev => {
      const combined = [...prev, ...arr];
      return combined.slice(0, MAX_FILES);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []);

  // Global paste listener for Ctrl+V / Cmd+V screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && ACCEPTED.includes(item.type)) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
        toast.success(`${imageFiles.length} screenshot(s) pasted from clipboard`);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    toast.loading('Uploading screenshots...', { id: 'upload' });

    try {
      const res = await uploadScreenshots(files, {
        uploaded_by: user?.email || user?.full_name || undefined,
        tags: tags.trim() || undefined,
      });

      toast.dismiss('upload');
      setFiles([]);
      setTags('');
      if (inputRef.current) inputRef.current.value = '';
      setUploadedResults(res.data);
      setCopiedUrl(null);
      fetchHistory(1, search);
    } catch (err: any) {
      toast.error(err.message, { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const copyUploadedLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('Link copied!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteScreenshot(deleteTarget.id);
      toast.success('Screenshot deleted');
      setDeleteTarget(null);
      fetchHistory(page, search);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = (rec: ScreenshotRecord) => {
    navigator.clipboard.writeText(rec.url);
    setCopiedId(rec.id);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1, search);
  };

  const allSelected = history.length > 0 && history.every(r => selectedIds.has(r.id));
  const someSelected = history.some(r => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(r => r.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copySelectedLinks = () => {
    const urls = history
      .filter(r => selectedIds.has(r.id))
      .map(r => r.url)
      .join('\n');
    navigator.clipboard.writeText(urls);
    toast.success(`${selectedIds.size} link(s) copied!`);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => deleteScreenshot(id)));
      toast.success(`${ids.length} screenshot(s) deleted`);
      setSelectedIds(new Set());
      fetchHistory(page, search);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ImageIcon className="size-8 text-violet-600" />
          <h1 className="text-3xl font-bold">Gallery </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Upload screenshots and get shareable direct links
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Images / Screenshots</CardTitle>
          <CardDescription>
            Drag & drop, click to browse, or paste (Ctrl+V) up to {MAX_FILES} images. Each file gets a shareable URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${dragOver
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                : 'border-muted-foreground/25 hover:border-violet-400'}
            `}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Drop images here, click to browse, or paste from clipboard</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Clipboard className="size-3 inline mr-1" />
              Ctrl+V to paste &mdash; PNG, JPG, GIF, WEBP &mdash; max 10 MB each
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              multiple
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
            />
          </div>

          {/* Selected files preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">
                Selected files ({files.length}/{MAX_FILES})
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted p-2.5 rounded-md">
                    <ImageIcon className="size-4 text-violet-600 shrink-0" />
                    <span className="text-sm truncate flex-1">{f.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatSize(f.size)}
                    </span>
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags input */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-1.5">
              <Tag className="size-3.5" />
              Tags <span className="text-muted-foreground text-xs font-normal">(optional, comma-separated)</span>
            </Label>
            <Input
              id="tags"
              placeholder="e.g. bug, login-page, sprint-23"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Upload {files.length > 0 ? `${files.length} image${files.length > 1 ? 's' : ''}` : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* History Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Your Gallery</CardTitle>
              <CardDescription>
                {total} screenshot{total !== 1 ? 's' : ''} uploaded
              </CardDescription>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or tag..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No screenshots yet. Upload your first one above.</p>
            </div>
          ) : (
            <>
              {/* Bulk action bar */}
              {someSelected && (
                <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                  <span className="text-sm font-medium">
                    {selectedIds.size} selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="destructive" size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                    >
                      {bulkDeleting
                        ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        : <Trash2 className="size-3.5 mr-1.5" />}
                      Delete Selected
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                      <X className="size-3.5 mr-1" /> Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Desktop table */}
              <div className="hidden md:block rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-[60px]">Preview</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((rec) => (
                      <TableRow key={rec.id} className={selectedIds.has(rec.id) ? 'bg-violet-50/50 dark:bg-violet-950/10' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(rec.id)}
                            onCheckedChange={() => toggleSelect(rec.id)}
                            aria-label={`Select ${rec.original_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setPreviewImg(rec)}
                            className="block w-10 h-10 rounded overflow-hidden border hover:ring-2 ring-violet-500 transition-all"
                          >
                            <img
                              src={rec.thumbnail_link || rec.url}
                              alt={rec.original_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[200px]">{rec.original_name}</p>
                          {rec.uploaded_by && (
                            <p className="text-xs text-muted-foreground">{rec.uploaded_by}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {rec.tags ? (
                            <div className="flex flex-wrap gap-1">
                              {rec.tags.split(',').map((t, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">
                                  {t.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatSize(rec.size)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(rec.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => copyLink(rec)}
                              title="Copy link"
                            >
                              {copiedId === rec.id
                                ? <Check className="size-4 text-green-600" />
                                : <Copy className="size-4" />}
                            </Button>
                            <Button
                              variant="ghost" size="sm" asChild
                            >
                              <a href={rec.url} target="_blank" rel="noopener noreferrer" title="Open in browser">
                                <ExternalLink className="size-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setDeleteTarget(rec)}
                              title="Delete"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden grid gap-3">
                {history.map((rec) => (
                  <div key={rec.id} className={`flex gap-3 p-3 border rounded-lg ${selectedIds.has(rec.id) ? 'border-violet-400 bg-violet-50/50 dark:bg-violet-950/10' : ''}`}>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <Checkbox
                        checked={selectedIds.has(rec.id)}
                        onCheckedChange={() => toggleSelect(rec.id)}
                        aria-label={`Select ${rec.original_name}`}
                      />
                    </div>
                    <button
                      onClick={() => setPreviewImg(rec)}
                      className="w-16 h-16 rounded overflow-hidden border shrink-0 hover:ring-2 ring-violet-500 transition-all"
                    >
                      <img
                        src={rec.thumbnail_link || rec.url}
                        alt={rec.original_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{rec.original_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(rec.size)} &middot;{' '}
                        {new Date(rec.created_at).toLocaleDateString()}
                      </p>
                      {rec.tags && (
                        <div className="flex flex-wrap gap-1">
                          {rec.tags.split(',').map((t, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {t.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1 pt-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyLink(rec)}>
                          {copiedId === rec.id ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                          Copy Link
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <a href={rec.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3 mr-1" /> Open
                          </a>
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-xs text-red-500"
                          onClick={() => setDeleteTarget(rec)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      disabled={page <= 1}
                      onClick={() => fetchHistory(page - 1, search)}
                    >
                      <ChevronLeft className="size-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      disabled={page >= totalPages}
                      onClick={() => fetchHistory(page + 1, search)}
                    >
                      Next <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewImg?.original_name}</DialogTitle>
            <DialogDescription>
              {previewImg && formatSize(previewImg.size)} &middot;{' '}
              {previewImg && new Date(previewImg.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {previewImg && (
            <div className="flex items-center justify-center max-h-[60vh] overflow-auto rounded-md bg-muted/30">
              <img
                src={previewImg.url}
                alt={previewImg.original_name}
                className="max-w-full max-h-[58vh] object-contain"
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => previewImg && copyLink(previewImg)}>
              <Copy className="size-4 mr-2" /> Copy Link
            </Button>
            <Button asChild>
              <a href={previewImg?.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-2" /> Open Link
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Screenshot</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.original_name}</strong> from
              storage and the history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload success dialog */}
      <Dialog open={uploadedResults.length > 0} onOpenChange={() => setUploadedResults([])}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="size-5 text-green-600" />
              {uploadedResults.length} Screenshot{uploadedResults.length > 1 ? 's' : ''} Uploaded Successfully
            </DialogTitle>
            <DialogDescription>
              Your images are ready. Copy the links below to share.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[40vh] overflow-auto">
            {uploadedResults.map((rec) => (
              <div key={rec.id} className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30">
                <img
                  src={rec.thumbnail_link || rec.url}
                  alt={rec.original_name}
                  className="w-10 h-10 rounded object-cover border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rec.original_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{rec.url}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => copyUploadedLink(rec.url)}
                    className="h-8"
                  >
                    {copiedUrl === rec.url
                      ? <><Check className="size-3.5 mr-1 text-green-600" /> Copied</>
                      : <><Copy className="size-3.5 mr-1" /> Copy Link</>}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8" asChild>
                    <a href={rec.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setUploadedResults([])}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
