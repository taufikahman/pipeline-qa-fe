const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Register a new user with organization
 */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  organization_name: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Registration failed');
  }

  return result;
}

/**
 * Login user
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface Organization {
  id: string;
  name: string;
  role: string;
  logo_url: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  avatar_url: string | null;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  organizations: Organization[];
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Login failed');
  }

  return result;
}

/**
 * Change password
 */
export interface ChangePasswordRequest {
  user_id: string;
  current_password: string;
  new_password: string;
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to change password');
  }

  return result;
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(userId: string, file: File): Promise<{ message: string; avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('user_id', userId);

  const response = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
    method: 'PUT',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to upload avatar');
  }

  return result;
}

/**
 * Upload organization logo (owner/admin only)
 */
export async function uploadOrgLogo(
  organizationId: string,
  userId: string,
  file: File
): Promise<{ message: string; logo_url: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  formData.append('organization_id', organizationId);
  formData.append('user_id', userId);

  const response = await fetch(`${API_BASE_URL}/auth/upload-org-logo`, {
    method: 'PUT',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to upload organization logo');
  }

  return result;
}

/**
 * Get the full URL for an uploaded file
 */
export function getUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return `${base}${path}`;
}

export interface RunPipelineResponse {
  success: boolean;
  data: {
    pipelineHistory: {
      id: number;
      pipeline_report_id: number;
      status: string;
      pass_rate: number;
      executed_at: string;
    };
    testResults: {
      passed: number;
      failed: number;
      total: number;
      pass_rate: number;
      status: string;
    };
    report: {
      id: number;
      release_status: string;
      created_at: string;
    };
  };
  message?: string;
  error?: string;
}

export interface LogEntry {
  prefix: string;
  message: string;
  type: 'normal' | 'success' | 'error' | 'warning';
}

export interface StageData {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  triageNote?: string;
  logs?: LogEntry[];
}

export interface PipelineHistoryEntry {
  id: number;
  pipeline_report_id: number | null;
  executed_at: string;
  pass_rate: number;
  status: string;
  created_at: string;
  report: {
    id: number;
    total_passed: number;
    total_failed: number;
    total_pending: number;
    pass_rate: number;
    release_status: string;
    created_at: string;
  } | null;
  stages: StageData[];
}

export interface PipelineHistory {
  id: number;
  pipeline_report_id: number;
  executed_at: string;
  pass_rate: number;
  status: string;
  created_at: string;
}

export interface PipelineReport {
  id: number;
  total_passed: number;
  total_failed: number;
  total_pending: number;
  pass_rate: number;
  release_status: string;
  created_at: string;
  executed_at?: string;
  stages?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    logs?: any[];
  }>;
}

/**
 * Run pipeline with Playwright smoke tests
 */
export async function runPipeline(stages?: any[]): Promise<RunPipelineResponse> {
  const response = await fetch(`${API_BASE_URL}/pipelines/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to run pipeline');
  }

  return response.json();
}

/**
 * Get pipeline history with associated reports and stages
 */
export async function getPipelineHistory(): Promise<{ success: boolean; data: PipelineHistoryEntry[] }> {
  const response = await fetch(`${API_BASE_URL}/pipelines/history`);

  if (!response.ok) {
    throw new Error('Failed to fetch pipeline history');
  }

  return response.json();
}

/**
 * Get pipeline reports with stages
 */
export async function getPipelineReports(): Promise<{ success: boolean; data: any[] }> {
  try {
    console.log('Fetching from:', `${API_BASE_URL}/pipelines/reports`);
    const response = await fetch(`${API_BASE_URL}/pipelines/reports`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to fetch pipeline reports: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    
    // Transform data to match frontend format
    if (result.success && result.data) {
      result.data = result.data.map((report: any) => ({
        id: report.id.toString(),
        runDate: new Date(report.executed_at || report.created_at),
        stages: report.stages || [],
        releaseStatus: report.release_status === 'RELEASED' || report.release_status === 'passed' ? 'passed' : 
                       report.release_status === 'BLOCKED' || report.release_status === 'blocked' ? 'blocked' : 'pending',
        passRate: parseFloat(report.pass_rate) || 0,
        total_passed: report.total_passed || 0,
        total_failed: report.total_failed || 0,
        total_pending: report.total_pending || 0,
        executed_at: report.executed_at,
        created_at: report.created_at,
      }));
      console.log('Transformed data:', result.data);
    } else {
      console.warn('No data in response or not successful:', result);
      result.data = [];
    }

    return result;
  } catch (error) {
    console.error('Error in getPipelineReports:', error);
    throw error;
  }
}

/**
 * Get pipeline by ID
 */
export async function getPipelineById(id: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/pipelines/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch pipeline');
  }

  return response.json();
}

/**
 * Save pipeline report and create history entry (with stage logs)
 */
export async function savePipelineReportToApi(
  stages: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    triageNote?: string;
    logs?: LogEntry[];
  }>,
  releaseStatus: 'pending' | 'passed' | 'blocked'
): Promise<{
  success: boolean;
  data: {
    history: {
      id: number;
      pipeline_report_id: number;
      executed_at: string;
      pass_rate: number;
      status: string;
    };
    report: {
      id: number;
      total_passed: number;
      total_failed: number;
      total_pending: number;
      pass_rate: number;
      release_status: string;
      created_at: string;
    };
    stagesCount: number;
    logsCount: number;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/pipelines/save-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stages, releaseStatus }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save pipeline report');
  }

  return response.json();
}

/**
 * Webhook response types
 */
export interface WebhookTestCase {
  tc_number: string;
  name: string;
  status: string;
  objective: string;
  precondition: string;
  steps: string;
  expectedResult: string;
  labels: string;
  priority: string;
  component: string;
  operatingSystem: string;
}

export interface WebhookSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface WebhookResponse {
  generationId: string;
  summary: WebhookSummary;
  tc_data: WebhookTestCase[];
}

// ─── Screenshots ─────────────────────────────────────────────────────────

export interface ScreenshotRecord {
  id: number;
  original_name: string;
  file_name: string;
  mime_type: string;
  size: number;
  storage_key: string;
  url: string;
  web_content_link: string | null;
  thumbnail_link: string | null;
  uploaded_by: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenshotUploadResponse {
  success: boolean;
  message: string;
  data: ScreenshotRecord[];
}

export interface ScreenshotHistoryResponse {
  success: boolean;
  data: ScreenshotRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function uploadScreenshots(
  files: File[],
  options?: { uploaded_by?: string; tags?: string }
): Promise<ScreenshotUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  if (options?.uploaded_by) formData.append('uploaded_by', options.uploaded_by);
  if (options?.tags) formData.append('tags', options.tags);

  const response = await fetch(`${API_BASE_URL}/screenshots/upload`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Upload failed');
  return result;
}

export async function getScreenshotHistory(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ScreenshotHistoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);

  const response = await fetch(`${API_BASE_URL}/screenshots/history?${query}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch history');
  return result;
}

export async function deleteScreenshot(id: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/screenshots/${id}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete');
  return result;
}

// ─── Test Case Management ────────────────────────────────────────────────

export interface ManagedTestCase {
  id: number;
  suite_id: number;
  tc_id: string;
  title: string;
  type: 'MANUAL' | 'AUTOMATED';
  behavior: 'POSITIVE' | 'NEGATIVE' | 'EDGE_CASE' | 'PERFORMANCE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string | null;
  pre_conditions: string | null;
  post_conditions: string | null;
  steps: Array<{ action: string; expected: string }>;
  assigned_to: string | null;
  component: string | null;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description: string | null;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestCaseDraft {
  id: number;
  generation_id: string | null;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  test_cases_data: any[];
  summary: WebhookSummary | null;
  target_suite_id: number | null;
  organization_id: string | null;
  created_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Suites ──

export async function getSuites(): Promise<{ success: boolean; data: TestSuite[] }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/suites`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch suites');
  return result;
}

export async function createSuite(data: { name: string; description?: string; organization_id?: string; created_by?: string }): Promise<{ success: boolean; data: TestSuite }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/suites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create suite');
  return result;
}

export async function updateSuite(id: number, data: { name?: string; description?: string }): Promise<{ success: boolean; data: TestSuite }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/suites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update suite');
  return result;
}

export async function deleteSuite(id: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/suites/${id}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete suite');
  return result;
}

// ── Test Cases ──

export async function getTestCases(suiteId?: number): Promise<{ success: boolean; data: ManagedTestCase[] }> {
  const query = suiteId ? `?suite_id=${suiteId}` : '';
  const response = await fetch(`${API_BASE_URL}/tc-management/cases${query}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch test cases');
  return result;
}

export async function getTestCaseById(id: number): Promise<{ success: boolean; data: ManagedTestCase }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/cases/${id}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch test case');
  return result;
}

export async function createTestCase(data: Partial<ManagedTestCase>): Promise<{ success: boolean; data: ManagedTestCase }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to create test case');
  return result;
}

export async function updateTestCase(id: number, data: Partial<ManagedTestCase>): Promise<{ success: boolean; data: ManagedTestCase }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update test case');
  return result;
}

export async function deleteTestCase(id: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/cases/${id}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete test case');
  return result;
}

// ── Drafts ──

export async function getDrafts(status?: string): Promise<{ success: boolean; data: TestCaseDraft[] }> {
  const query = status ? `?status=${status}` : '';
  const response = await fetch(`${API_BASE_URL}/tc-management/drafts${query}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch drafts');
  return result;
}

export async function getDraftById(id: number): Promise<{ success: boolean; data: TestCaseDraft }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/drafts/${id}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch draft');
  return result;
}

export async function saveDraft(data: {
  generation_id?: string;
  title: string;
  test_cases_data: any[];
  summary?: WebhookSummary | null;
  target_suite_id?: number | null;
  organization_id?: string;
  created_by?: string;
}): Promise<{ success: boolean; data: TestCaseDraft }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to save draft');
  return result;
}

export async function updateDraft(id: number, data: Partial<TestCaseDraft>): Promise<{ success: boolean; data: TestCaseDraft }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/drafts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update draft');
  return result;
}

export async function deleteDraft(id: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/tc-management/drafts/${id}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete draft');
  return result;
}

export async function approveDraft(id: number, suiteId?: number): Promise<{
  success: boolean;
  data: { draft: TestCaseDraft; suite_id: number; created_count: number };
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/tc-management/drafts/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suite_id: suiteId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to approve draft');
  return result;
}

// ─── Test Case Generation (existing) ────────────────────────────────────

export interface GenerateResponse {
  success: boolean;
  data: WebhookResponse;
  message: string;
}

/**
 * Generate test cases via N8N webhook
 * Sends title_story, description_story, and optional images as multipart/form-data
 */
export async function generateTestCasesWebhook(data: {
  title_story: string;
  description_story: string;
  images?: File[];
}): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append('title_story', data.title_story);
  formData.append('description_story', data.description_story);

  // Append images if provided
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await fetch(`${API_BASE_URL}/test-cases/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate test cases');
  }

  return response.json();
}
