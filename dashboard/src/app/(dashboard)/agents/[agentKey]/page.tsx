'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bot, ArrowLeft, Square, RefreshCw, 
  MessageSquare, Cpu, Zap, AlertCircle, CheckCircle, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MemoryBrowser } from '@/components/MemoryBrowser';

interface AgentInstance {
  id: string;
  name: string;
  role: string;
  world_id: string;
  env_id: string;
  project_id: string;
  agent_id: string;
  model: string;
  status: string;
  session_key?: string;
  started_at?: string;
  last_activity?: string;
  error?: string;
}

interface AgentDetails {
  instance?: AgentInstance;
  config?: {
    metadata: Record<string, unknown>;
    body: string;
  };
  content?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  role: string;
  content: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentKey = decodeURIComponent(params.agentKey as string);
  const [worldId, envId, projectId, agentId] = agentKey.split('/');
  
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [sendingTask, setSendingTask] = useState(false);
  const [task, setTask] = useState('');
  const [showSendTask, setShowSendTask] = useState(false);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentKey)}`);
      const data = await res.json();
      if (data.success) {
        setAgent(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    } finally {
      setLoading(false);
    }
  }, [agentKey]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentKey)}/logs`);
      const data = await res.json();
      if (data.success && data.data?.logs) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [agentKey]);

  useEffect(() => {
    // Initial fetch
    fetchAgent();
    fetchLogs();
    
    // Setup SSE connection for real-time updates
    const eventSource = new EventSource(`/api/agents/${encodeURIComponent(agentKey)}/stream`);
    
    eventSource.addEventListener('log', (event) => {
      const newLog = JSON.parse(event.data);
      setLogs(prev => {
        // Avoid duplicates
        if (prev.some(l => l.id === newLog.id)) return prev;
        return [...prev, newLog];
      });
    });
    
    eventSource.addEventListener('status', (event) => {
      const agentData = JSON.parse(event.data);
      setAgent(prev => prev ? { ...prev, instance: agentData } : prev);
    });
    
    eventSource.addEventListener('connected', () => {
      console.log('SSE connected');
    });
    
    eventSource.onerror = () => {
      console.log('SSE error, reconnecting...');
    };
    
    return () => {
      eventSource.close();
    };
  }, [agentKey, fetchAgent, fetchLogs]);

  const handleSendTask = async () => {
    if (!task.trim()) return;
    
    setSendingTask(true);
    try {
      // Task endpoint now uses spawn which handles everything:
      // - Creates session if needed
      // - Sends to existing session if available
      // - Writes logs
      const res = await fetch(`/api/agents/${encodeURIComponent(agentKey)}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSendTask(false);
        setTask('');
        fetchLogs();
      } else {
        alert(data.error || 'Failed to send task');
      }
    } catch (error) {
      console.error('Failed to send task:', error);
    } finally {
      setSendingTask(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentKey)}/stop`, {
        method: 'POST',
      });
      await res.json();
      fetchAgent();
    } catch (error) {
      console.error('Failed to stop:', error);
    } finally {
      setStopping(false);
    }
  };

  const saveContent = async (content: string) => {
    await fetch(`/api/agents/${encodeURIComponent(agentKey)}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    fetchAgent();
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const instance = agent?.instance;
  const isRunning = instance?.status === 'idle' || instance?.status === 'busy' || instance?.status === 'running';
  const hasError = instance?.status === 'error';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/agents">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${
            isRunning 
              ? 'bg-green-500/10 border border-green-500/20' 
              : hasError
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-zinc-800 border border-zinc-700'
          }`}>
            <Bot className={`w-6 h-6 sm:w-7 sm:h-7 ${
              isRunning ? 'text-green-400' : hasError ? 'text-red-400' : 'text-zinc-500'
            }`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                {String(agent?.config?.metadata?.name || agentId)}
              </h1>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${
                isRunning
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : hasError
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {instance?.status || 'unknown'}
              </span>
            </div>
            <p className="text-zinc-500 text-xs sm:text-sm truncate">
              {worldId} / {projectId} / {agentId}
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="ghost" size="icon" onClick={() => { fetchAgent(); fetchLogs(); }}>
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button onClick={() => setShowSendTask(true)} size="sm" className="flex-1 sm:flex-none">
            <Send className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Task Gönder</span>
          </Button>
          {isRunning && (
            <Button variant="destructive" size="sm" onClick={handleStop} disabled={stopping}>
              <Square className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{stopping ? 'Stopping...' : 'Stop'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {hasError && instance?.error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Error</p>
                <p className="text-sm text-red-300/80">{instance.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="content">AGENT.md</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-zinc-500 text-sm">Status</span>
                  <span className={`font-medium ${
                    isRunning ? 'text-green-400' : hasError ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {instance?.status || 'unknown'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-zinc-500 text-sm">Session Key</span>
                  <code className="text-xs bg-zinc-800 px-2 py-1 rounded font-mono text-zinc-300 break-all">
                    {instance?.session_key ? `...${instance.session_key.slice(-20)}` : '-'}
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-zinc-500 text-sm">Started At</span>
                  <span className="text-zinc-300 text-sm">{formatTime(instance?.started_at)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-zinc-500 text-sm">Last Activity</span>
                  <span className="text-zinc-300 text-sm">{formatTime(instance?.last_activity)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Config Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-zinc-500 text-sm">Role</span>
                  <span className="text-zinc-300">{String(agent?.config?.metadata?.role || instance?.role || '-')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-zinc-500 text-sm">Model</span>
                  <span className="text-zinc-300 text-sm break-all">{String(agent?.config?.metadata?.model || instance?.model || '-')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <span className="text-zinc-500 text-sm">Skills</span>
                  <div className="flex gap-1 flex-wrap">
                    {(agent?.config?.metadata?.skills as string[] || []).map((skill) => (
                      <span key={skill} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Info (if running) */}
          {isRunning && instance?.session_key && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Active Session
                </CardTitle>
                <CardDescription>Agent aktif olarak çalışıyor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-green-400 font-medium">Agent Ready</p>
                        <p className="text-sm text-zinc-400">Session: {instance.session_key}</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowSendTask(true)}>
                      <Send className="w-4 h-4 mr-2" />
                      Task Gönder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Session Logs</CardTitle>
                <CardDescription>Agent konuşma geçmişi</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchLogs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg ${
                        log.role === 'assistant'
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : log.role === 'user'
                          ? 'bg-zinc-800 border border-zinc-700'
                          : 'bg-zinc-900 border border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium ${
                          log.role === 'assistant' ? 'text-blue-400' : 'text-zinc-400'
                        }`}>
                          {log.role === 'assistant' ? '🤖 Agent' : '👤 Task'}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {log.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">Henüz log yok</p>
                  <p className="text-zinc-600 text-sm mt-1">
                    Agent çalıştığında loglar burada görünecek
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AGENT.md Tab */}
        <TabsContent value="content">
          <MarkdownEditor
            title="AGENT.md"
            description="Agent configuration and context"
            content={agent?.content || ''}
            onSave={saveContent}
          />
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory">
          <MemoryBrowser
            entityPath={`/api/agents/${encodeURIComponent(agentKey)}`}
            entityType="agent"
          />
        </TabsContent>
      </Tabs>

      {/* Send Task Modal */}
      {showSendTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Task Gönder</CardTitle>
              <CardDescription>Agent'a görev gönder {!isRunning && '(otomatik başlatılacak)'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Task</label>
                  <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Agent'a ne yapmasını istiyorsun?"
                    rows={6}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="ghost" onClick={() => { setShowSendTask(false); setTask(''); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendTask} disabled={sendingTask || !task.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {sendingTask ? 'Gönderiliyor...' : 'Gönder'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
