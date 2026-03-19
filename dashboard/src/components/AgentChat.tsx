'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pending?: boolean;
}

interface AgentChatProps {
  agentKey: string;
  agentName: string;
  isRunning: boolean;
}

export function AgentChat({ agentKey, agentName, isRunning }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const pendingMessage: Message = {
      id: `pending-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      pending: true,
    };

    setMessages(prev => [...prev, userMessage, pendingMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentKey)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data = await res.json();
      
      setMessages(prev => {
        const filtered = prev.filter(m => !m.pending);
        if (data.success && data.reply) {
          return [...filtered, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date(),
          }];
        } else {
          return [...filtered, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.error || 'Cevap alınamadı. Agent meşgul olabilir.',
            timestamp: new Date(),
          }];
        }
      });
    } catch (error) {
      setMessages(prev => {
        const filtered = prev.filter(m => !m.pending);
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Bağlantı hatası. Tekrar deneyin.',
          timestamp: new Date(),
        }];
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] bg-zinc-900 rounded-lg border border-zinc-800">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-lg font-medium">{agentName}</p>
            <p className="text-zinc-600 text-sm mt-1">
              {isRunning ? 'Agent hazır. Mesaj gönderebilirsin.' : 'Agent başlatılacak.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                {msg.pending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-zinc-400">Düşünüyor...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-300" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesaj yaz..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || sending}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          Enter ile gönder, Shift+Enter ile yeni satır
        </p>
      </div>
    </div>
  );
}
