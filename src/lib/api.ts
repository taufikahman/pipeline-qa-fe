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
 * Generate test cases via N8N webhook
 */
export async function generateTestCases(data: {
  type: 'jira' | 'manual';
  content: string;
  metadata?: any;
}): Promise<{ success: boolean; data: any; message: string }> {
  const response = await fetch(`${API_BASE_URL}/test-cases/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate test cases');
  }

  return response.json();
}

/**
 * Generate test cases with file upload (PDF)
 */
export async function generateTestCasesWithFile(
  file: File,
  type: 'jira' | 'manual',
  metadata?: any
): Promise<{ success: boolean; data: any; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await fetch(`${API_BASE_URL}/test-cases/generate-with-file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate test cases from file');
  }

  return response.json();
}
