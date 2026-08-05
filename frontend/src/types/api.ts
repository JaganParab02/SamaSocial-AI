/**
 * TypeScript interfaces matching backend Pydantic models.
 * Shared by all services and components.
 */

// ─── Source & Document Types ───────────────────────────────────────────

export type SourceType = 'pdf' | 'ppt' | 'pptx' | 'web' | 'youtube';

export type SourceFilter = 'all' | 'pdf' | 'ppt' | 'web' | 'youtube';

export interface SourceResponse {
  source_id: string;
  source_name?: string;
  name?: string;
  source_type?: SourceType;
  type?: SourceType;
  status: 'processing' | 'ready' | 'error' | string;
  chunks_count?: number;
  processing_time_ms?: number;
  metadata?: {
    chunks_count?: number;
    [key: string]: unknown;
  };
  summary?: string;
  created_at?: string;
  uploaded_at?: string;
  session_id?: string;
  error_message?: string;
}

export interface UploadResponse {
  success: boolean;
  document_id: string;
  source_name: string;
  source_type: SourceType;
  chunks_count: number;
  vectors_stored: number;
  summary: string;
  message: string;
}

// ─── Chat Types ────────────────────────────────────────────────────────

export interface ChatRequest {
  session_id: string;
  question: string;
  source_filter?: SourceFilter;
  top_k?: number;
}

export interface Citation {
  source_id: string;
  source_name?: string;
  name?: string;
  source_type?: SourceType;
  type?: SourceType;
  page_number?: number;
  slide_number?: number;
  timestamp?: string;
  url?: string;
  relevance_score: number;
  formatted: string;
}

export interface RetrievedChunk {
  chunk_id: string;
  chunk_text: string;
  source_id: string;
  source_name: string;
  source_type: SourceType;
  similarity_score: number;
  page_number?: number;
  slide_number?: number;
  timestamp?: string;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  citations: Citation[];
  retrieved_chunks: RetrievedChunk[];
  is_out_of_scope: boolean;
  follow_up_possible: boolean;
  model?: string;
  tokens_used?: number;
}

// ─── Streaming Types ───────────────────────────────────────────────────

export interface StreamEvent {
  event: 'token' | 'citations' | 'done' | 'error';
  data: string | Citation[] | Record<string, unknown>;
}

// ─── Session & History Types ───────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationHistory {
  session_id: string;
  messages: ConversationMessage[];
  message_count: number;
  sources: string[];
  created_at: string;
  updated_at: string;
}

// ─── Health Types ──────────────────────────────────────────────────────

export interface HealthComponent {
  component: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  components: Record<string, HealthComponent>;
}

// ─── UI State Types ────────────────────────────────────────────────────

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  isError?: boolean;
  timestamp: Date;
}

export interface UploadItem {
  id: string;
  file?: File;
  url?: string;
  type: 'file' | 'url' | 'youtube';
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: UploadResponse;
}

// ─── Planner Types ─────────────────────────────────────────────────────

export interface Resource {
  title: string;
  url?: string | null;
  type: string;
}

export interface Assessment {
  title: string;
  description: string;
  type: string;
}

export interface Project {
  title: string;
  description: string;
  difficulty: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  estimated_duration_minutes: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  difficulty: string;
  estimated_duration_hours: number;
  lessons: Lesson[];
  resources: Resource[];
  assessments: Assessment[];
  projects: Project[];
}

export interface CoursePlan {
  title: string;
  subject: string;
  description: string;
  target_audience: string;
  prerequisites: string[];
  learning_outcomes: string[];
  modules: Module[];
}
