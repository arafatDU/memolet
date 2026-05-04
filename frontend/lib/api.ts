/** Centralised API client — automatically attaches Bearer token */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memolet_token');
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const token = getToken();

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    mergedHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: mergedHeaders,
    ...rest,
  });

  if (res.status === 401) {
    localStorage.removeItem('memolet_token');
    localStorage.removeItem('memolet_user');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth endpoints ──────────────────────────────────────────────────────────

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse extends AuthTokenResponse {
  user: { username: string; id: string };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    }),

  register: (payload: LoginPayload) =>
    apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    }),
};

// ── Memory endpoints ────────────────────────────────────────────────────────

export interface MemoletDTO {
  id: string;
  text: string;
  keywords: string[];
  color?: string;
  weight?: number;
  displayId?: string; // computed client-side: "1_0", "1_1", "2_0", ...
}

/**
 * Assigns short human-readable IDs ("1_0", "1_1", ..., "2_0") to an ordered
 * array of memolets. Index 0 → "1_0", index 9 → "1_9", index 10 → "2_0", etc.
 * Call this once after fetching from the API to get stable short IDs.
 */
export function assignDisplayIds<T extends MemoletDTO>(memolets: T[]): T[] {
  return memolets.map((m, i) => ({
    ...m,
    displayId: `${Math.floor(i / 10) + 1}_${i % 10}`,
  }));
}

/** Parse the structured text format into component parts */
export function parseMemoletText(text: string): {
  summary: string;
  user: string;
  ai: string;
  isStructured: boolean;
} {
  const summaryMatch = text.match(/Summary:\s*([\s\S]*?)(?=\nUser:|$)/i);
  const userMatch = text.match(/User:\s*([\s\S]*?)(?=\nAI:|$)/i);
  const aiMatch = text.match(/AI:\s*([\s\S]*)/i);

  if (userMatch && aiMatch) {
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      user: userMatch[1].trim(),
      ai: aiMatch[1].trim(),
      isStructured: true,
    };
  }
  return { summary: '', user: '', ai: text, isStructured: false };
}

export const memoriesApi = {
  /** Returns all memolets with stable short display IDs assigned */
  getAll: () =>
    apiFetch<MemoletDTO[]>('/memories/').then(assignDisplayIds),
  /** GraphRAG search — results also get display IDs based on their returned order */
  search: (query: string) =>
    apiFetch<MemoletDTO[]>(`/memories/search?query=${encodeURIComponent(query)}`).then(assignDisplayIds),
  seedDemo: () =>
    apiFetch<{ message: string; created?: { id: string; summary: string }[] }>(
      '/memories/seed-demo',
      { method: 'POST' }
    ),
};

// ── Chat endpoint ───────────────────────────────────────────────────────────

export interface ChatMessageDTO {
  id: string;
  role: 'user' | 'ai';
  content: string;
  citations?: string[];
  created_at: string;
}

export interface ConversationListResponse {
  id: string;
  title?: string;
  created_at: string;
}

export interface ConversationResponse extends ConversationListResponse {
  messages: ChatMessageDTO[];
}

export interface ChatRequest {
  message: string;
  active_memolet_ids: string[];
  model?: string;
  conversation_id?: string;
}

export interface ChatResponse {
  reply: string;
  sentences: string[];
  confidence_heatmap: number[];
  citations: string[][];
  conflict_warning: boolean;
  conversation_id: string;
}

export interface MemorySaveRequest {
  messages: { user: string; ai: string }[];
  conversation_id?: string;
}

export const chatApi = {
  send: (payload: ChatRequest) =>
    apiFetch<ChatResponse>('/chat/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  saveMemory: (payload: MemorySaveRequest) =>
    apiFetch<{ message: string; saved: { id: string; summary: string }[] }>(
      '/chat/save-memory',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  getModels: () =>
    apiFetch<{ models: string[]; default: string }>('/chat/models'),
  getConversations: () =>
    apiFetch<ConversationListResponse[]>('/chat/conversations'),
  getConversation: (id: string) =>
    apiFetch<ConversationResponse>(`/chat/conversations/${id}`),
  deleteConversation: (id: string) =>
    apiFetch<{ message: string }>(`/chat/conversations/${id}`, { method: 'DELETE' }),
};
