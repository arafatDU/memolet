const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: () => Promise<string | null>) {
  clerkTokenGetter = getter;
}

export async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) return token;
    } catch {
      // Fallback
    }
  }

  // Check if Clerk is loaded on window
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Clerk?.session) {
    try {
      // @ts-ignore
      const token = await window.Clerk.session.getToken();
      if (token) return token;
    } catch {
      // Fallback
    }
  }

  return localStorage.getItem('memolet_token');
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const token = await getToken();

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
    // If not on login/register/landing, redirect to login
    if (typeof window !== 'undefined' && !['/', '/login', '/register'].includes(window.location.pathname)) {
      window.location.href = '/login';
    }
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
  model?: string;
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
  sendStream: async (
    payload: ChatRequest,
    onToken: (token: string) => void,
    onComplete: (data: { conversation_id: string; citations?: string[][]; model?: string }) => void,
    onError: (err: Error) => void
  ) => {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('ReadableStream not supported');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.token) {
                onToken(data.token);
              }
              if (data.done) {
                onComplete(data);
              }
            } catch {
              // ignore partial json
            }
          }
        }
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err : new Error('Stream request failed'));
    }
  },
  saveMemory: (payload: MemorySaveRequest) =>
    apiFetch<{ message: string; saved: { id: string; summary: string }[] }>(
      '/chat/save-memory',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  getModels: () =>
    apiFetch<{ models: string[]; grouped?: Record<string, string[]>; default: string }>('/chat/models'),
  getConversations: () =>
    apiFetch<ConversationListResponse[]>('/chat/conversations'),
  getConversation: (id: string) =>
    apiFetch<ConversationResponse>(`/chat/conversations/${id}`),
  deleteConversation: (id: string) =>
    apiFetch<{ message: string }>(`/chat/conversations/${id}`, { method: 'DELETE' }),
};
