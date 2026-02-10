import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Play, Plus, X } from 'lucide-react';

export interface TestConfig {
  method: string;
  endpoint: string;
  urlParams: string;
  payload?: string;
  headers?: Record<string, string>;
}

interface TestConfigFormProps {
  onRunTest: (config: TestConfig) => void;
  isRunning: boolean;
}

interface ParamRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface HeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export function TestConfigForm({ onRunTest, isRunning }: TestConfigFormProps) {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('https://api.example.com/users');
  const [params, setParams] = useState<ParamRow[]>([
    { id: '1', key: 'limit', value: '100', enabled: true },
    { id: '2', key: 'offset', value: '0', enabled: true },
  ]);
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [payload, setPayload] = useState('{\n  "name": "John Doe",\n  "email": "john@example.com"\n}');
  const [rawParams, setRawParams] = useState('');

  // Generate URL params string from params array
  useEffect(() => {
    const enabledParams = params.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const paramString = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      setRawParams('?' + paramString);
    } else {
      setRawParams('');
    }
  }, [params]);

  // Parse raw params into structured params
  const parseRawParams = (rawParamString: string) => {
    const paramString = rawParamString.startsWith('?') ? rawParamString.slice(1) : rawParamString;
    if (!paramString) {
      setParams([]);
      return;
    }

    const parsedParams = paramString.split('&').map((param, index) => {
      const [key, value] = param.split('=');
      return {
        id: Date.now().toString() + index,
        key: decodeURIComponent(key || ''),
        value: decodeURIComponent(value || ''),
        enabled: true,
      };
    });
    setParams(parsedParams);
  };

  const addParam = () => {
    setParams([...params, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
  };

  const updateParam = (id: string, field: keyof ParamRow, value: string | boolean) => {
    setParams(params.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeParam = (id: string) => {
    setParams(params.filter(p => p.id !== id));
  };

  const addHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '', enabled: true }]);
  };

  const updateHeader = (id: string, field: keyof HeaderRow, value: string | boolean) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const enabledHeaders = headers
      .filter(h => h.enabled && h.key)
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

    onRunTest({ 
      method, 
      endpoint, 
      urlParams: rawParams,
      payload: ['POST', 'PUT', 'PATCH'].includes(method) ? payload : undefined,
      headers: enabledHeaders,
    });
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(payload);
      setPayload(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Invalid JSON, keep as is
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Configuration</CardTitle>
        <CardDescription>Configure your k6 performance test parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>

          <Tabs defaultValue="params" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="params">Params</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <TabsTrigger value="body">Body</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="params" className="space-y-3">
              <div className="space-y-2">
                <Label>Query Parameters</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {params.map((param) => (
                    <div key={param.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) => updateParam(param.id, 'enabled', e.target.checked)}
                        className="size-4"
                      />
                      <Input
                        placeholder="Key"
                        value={param.key}
                        onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParam(param.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addParam} className="w-full">
                  <Plus className="mr-2 size-4" />
                  Add Parameter
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rawParams">Raw Parameters</Label>
                <Input
                  id="rawParams"
                  type="text"
                  value={rawParams}
                  onChange={(e) => {
                    setRawParams(e.target.value);
                    parseRawParams(e.target.value);
                  }}
                  placeholder="?param1=value1&param2=value2"
                />
              </div>
            </TabsContent>

            <TabsContent value="headers" className="space-y-3">
              <div className="space-y-2">
                <Label>Request Headers</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {headers.map((header) => (
                    <div key={header.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                        className="size-4"
                      />
                      <Input
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeader(header.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addHeader} className="w-full">
                  <Plus className="mr-2 size-4" />
                  Add Header
                </Button>
              </div>
            </TabsContent>

            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <TabsContent value="body" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payload">Request Body (JSON)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={formatJSON}>
                      Format JSON
                    </Button>
                  </div>
                  <Textarea
                    id="payload"
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    placeholder='{\n  "key": "value"\n}'
                    className="font-mono text-sm min-h-[200px]"
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>

          <Button type="submit" className="w-full" disabled={isRunning}>
            <Play className="mr-2 size-4" />
            {isRunning ? 'Running Test...' : 'Run Performance Test'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
