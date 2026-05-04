'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMemoletStore } from '@/store/useMemoletStore';
import { MessageSquareText, Send, X, Save, Sparkles, Plus, Trash2, MessageSquare, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatApi, ConversationListResponse, ChatMessageDTO } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  citations?: string[];
};

export default function ChatOverlay() {
  const { rightSidebarOpen, setRightSidebarOpen, highlightNode, nodes, setMemoriesNeedsSync } = useMemoletStore();

  const [inputValue, setInputValue] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedMessagesForMemory, setSelectedMessagesForMemory] = useState<Set<string>>(new Set());
  const [savingMemory, setSavingMemory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // New Chat History States
  const [conversations, setConversations] = useState<ConversationListResponse[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available models
  useEffect(() => {
    chatApi.getModels()
      .then(data => {
        setModels(data.models ?? []);
        if (data.default) setSelectedModel(data.default);
      })
      .catch(() => {
        setModels(['gemini/gemini-2.5-flash-preview-04-17', 'gemini/gemini-2.0-flash']);
        setSelectedModel('gemini/gemini-2.5-flash-preview-04-17');
      });
  }, []);

  // Fetch conversations when sidebar opens
  useEffect(() => {
    if (rightSidebarOpen) {
      fetchConversations();
    }
  }, [rightSidebarOpen]);

  const fetchConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  };

  const loadConversation = async (id: string) => {
    setCurrentConversationId(id);
    setLoading(true);
    try {
      const data = await chatApi.getConversation(id);
      setMessages(data.messages.map((m: ChatMessageDTO) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations
      })));
    } catch (error) {
      console.error('Failed to load conversation', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const deleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        createNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat', error);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect @mention trigger
  useEffect(() => {
    const match = inputValue.match(/@(\w*)$/);
    if (match) {
      setShowMention(true);
      setMentionQuery(match[1].toLowerCase());
    } else {
      setShowMention(false);
      setMentionQuery('');
    }
  }, [inputValue]);

  const insertMention = useCallback((id: string) => {
    setInputValue((prev) => prev.replace(/@\w*$/, `@${id} `));
    setShowMention(false);
    inputRef.current?.focus();
  }, []);

  const filteredMemolets = nodes.filter(
    (m) => {
      const displayStr = m.data.displayId || m.id;
      return displayStr.toLowerCase().includes(mentionQuery) ||
             m.data.keywords.some((k) => k.toLowerCase().includes(mentionQuery));
    }
  );

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    const mentionedStrs = [...text.matchAll(/@([\w-]+)/g)].map((match) => match[1]);
    const mentionedIds = mentionedStrs.map(str => {
      const node = nodes.find(n => n.data.displayId === str || n.id === str);
      return node ? node.id : str;
    });
    
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: Message = { id: userMsgId, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const data = await chatApi.send({
        message: text,
        active_memolet_ids: mentionedIds,
        model: selectedModel || undefined,
        conversation_id: currentConversationId || undefined
      });

      if (!currentConversationId && data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
        fetchConversations(); // refresh list to get the new title
      } else if (currentConversationId && messages.length === 0) {
          fetchConversations(); // if it was the first message in an existing chat, refresh to get title
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: data.reply ?? 'No response.',
          citations: data.citations?.flat() ?? [],
        },
      ]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: `⚠️ Error: ${errorMsg}\n\nMake sure you are logged in and the backend is running.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, selectedModel, currentConversationId, messages.length, nodes]);

  const toggleMemorySelection = (aiMsgId: string) => {
    setSelectedMessagesForMemory((prev) => {
      const next = new Set(prev);
      if (next.has(aiMsgId)) next.delete(aiMsgId);
      else next.add(aiMsgId);
      return next;
    });
  };

  const handleSaveMemory = async () => {
    if (selectedMessagesForMemory.size === 0) return;
    setSavingMemory(true);
    setSaveStatus('idle');

    const pairsToSave: { user: string; ai: string }[] = [];
    selectedMessagesForMemory.forEach((aiId) => {
      const aiIndex = messages.findIndex((m) => m.id === aiId);
      if (aiIndex > 0) {
        for (let i = aiIndex - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            pairsToSave.push({
              user: messages[i].content,
              ai: messages[aiIndex].content,
            });
            break;
          }
        }
      }
    });

    try {
      await chatApi.saveMemory({ messages: pairsToSave, conversation_id: currentConversationId || undefined });
      setSaveStatus('success');
      setMemoriesNeedsSync(true); // Trigger a sync for Get Memory Tab
      setSelectedMessagesForMemory(new Set());
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Save memory error:', errorMsg);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSavingMemory(false);
    }
  };

  const displayModel = (model: string) => {
    if (model.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
    if (model.includes('gemini-2.0-flash')) return 'Gemini 2.0 Flash';
    if (model.includes('llama3')) return 'LLaMA 3 (Groq)';
    return model;
  };

  if (!rightSidebarOpen) {
    return (
      <div className="absolute bottom-6 right-6 z-50">
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="p-4 bg-blue-500 rounded-2xl text-white shadow-lg hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95"
          title="Open chat"
        >
          <MessageSquareText size={26} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-4 bottom-4 w-[840px] flex h-[700px] max-h-[calc(100vh-6rem)] rounded-2xl bg-white border border-gray-200 shadow-2xl z-40 overflow-hidden">
      
      {/* Sidebar for Chat History */}
      {sidebarOpen && (
        <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-medium text-sm border border-blue-100"
            >
              <Plus size={16} /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition text-sm",
                  currentConversationId === conv.id
                    ? "bg-white border border-blue-200 shadow-sm text-blue-700"
                    : "hover:bg-gray-100 text-gray-700 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <MessageSquare size={14} className={currentConversationId === conv.id ? "text-blue-500" : "text-gray-400"} />
                  <span className="truncate flex-1 font-medium text-xs">
                    {conv.title || 'New Conversation'}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteChat(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 bg-white">
        {/* Header */}
        <div className="flex flex-col bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                  "p-1.5 rounded-lg transition text-gray-400 hover:bg-gray-200 hover:text-gray-700",
                  sidebarOpen && "bg-gray-200 text-gray-700"
                )}
                title="Toggle Sidebar"
              >
                <PanelLeft size={16} />
              </button>
              <Sparkles size={15} className="text-blue-500 ml-1" />
              AI Assistant
            </div>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 bg-white gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 text-gray-600 bg-gray-50 flex-1 min-w-0"
            >
              {models.length === 0 && <option value="">Loading models…</option>}
              {models.map((m) => (
                <option key={m} value={m}>
                  {displayModel(m)}
                </option>
              ))}
            </select>

            {selectedMessagesForMemory.size > 0 && (
              <button
                onClick={handleSaveMemory}
                disabled={savingMemory}
                className={cn(
                  'flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold transition whitespace-nowrap border disabled:opacity-50',
                  saveStatus === 'success'
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : saveStatus === 'error'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                )}
              >
                <Save size={12} />
                {savingMemory
                  ? 'Saving…'
                  : saveStatus === 'success'
                  ? '✓ Saved!'
                  : saveStatus === 'error'
                  ? 'Failed'
                  : `Save ${selectedMessagesForMemory.size} to Memory`}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfdfd]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Sparkles size={22} className="text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Ask me anything</p>
              <p className="text-xs text-gray-400 max-w-[260px]">
                Use <span className="font-mono bg-gray-100 px-1 rounded">@</span> to cite memories from your canvas in the prompt.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={msg.id ?? i}
              className={cn(
                'flex flex-col gap-1 max-w-[90%]',
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start group'
              )}
            >
              <div
                className={cn(
                  'px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm prose prose-sm prose-blue max-w-none whitespace-normal'
                )}
              >
                {msg.role === 'ai' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}

                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.citations.map((citeId, j) => {
                      const citedNode = nodes.find(n => n.id === citeId);
                      const display = citedNode?.data.displayId ?? citeId.substring(0, 6);
                      return (
                        <span
                          key={j}
                          onMouseEnter={() => highlightNode(citeId)}
                          onMouseLeave={() => highlightNode(null)}
                          className="inline-flex items-center text-[10px] font-mono font-bold bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-blue-100 transition shadow-sm"
                        >
                          [{display}]
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.role === 'ai' && msg.id && (
                <label className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 cursor-pointer hover:text-blue-500 transition opacity-0 group-hover:opacity-100">
                  <input
                    type="checkbox"
                    checked={selectedMessagesForMemory.has(msg.id)}
                    onChange={() => toggleMemorySelection(msg.id!)}
                    className="rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
                  />
                  Save to Memory
                </label>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mr-auto">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
              </span>
              Thinking…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-3 relative">
          {showMention && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
              <div className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 sticky top-0 rounded-t-xl">
                Select Memory
              </div>
              {filteredMemolets.length === 0 ? (
                <div className="p-3 text-xs text-gray-400">No memories on canvas yet.</div>
              ) : (
                filteredMemolets.map((m) => {
                  const display = m.data.displayId ?? m.id.substring(0, 8);
                  return (
                    <button
                      key={m.id}
                      onClick={() => insertMention(m.data.displayId ?? m.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition"
                    >
                      <span className="font-mono font-bold text-gray-800">📝 {display}</span>
                      <span className="ml-2 text-gray-400 text-xs">
                        {m.data.keywords.slice(0, 4).join(', ')}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 focus-within:border-blue-400 focus-within:bg-white transition shadow-sm">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showMention && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === 'Escape') setShowMention(false);
              }}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none text-gray-800"
              placeholder="Ask anything or use @ to cite a memory…"
              autoComplete="off"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="mr-2 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-lg transition"
              title="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
