'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bot, ArrowLeft, Play, Square, RefreshCw, Clock, 
  MessageSquare, Cpu, Zap, AlertCircle, CheckCircle
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

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentKey = decodeURIComponent(params.agentKey as string);
  const [worldId, envId, projectId, agentId] = agentKey.split('/');
  
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [spawning, setSpawning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [task, setTask] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

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

  useEffect(() => {
    fetchAgent();
    // Poll for status updates
    const interval = setInterval(fetchAgent, 5000);
    return () => clearInterval(interval);
  }, [fetchAgent]);

  const handleSpawn = async () => {
    setSpawning(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentKey)}/spawn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      if (data.success) {
        setShowTaskInput(false);
        setTask('');
        fetchAgent();
      } else {
        alert(data.error || 'Failed to spawn agent');
      }
    } catch (error) {
      console.error('Failed to spawn:', error);
    } finally {
      setSpawning(false);
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
  const isRunning = instance?.status === 'running';
  const hasError = instance?.status === 'error';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            isRunning 
              ? 'bg-green-500/10 border border-green-500/20' 
              : hasError
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-zinc-800 border border-zinc-700'
          }`}>
            <Bot className={`w-7 h-7 ${
              isRunning ? 'text-green-400' : hasError ? 'text-red-400' : 'text-zinc-500'
            }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {agent?.config?.metadata?.name || agentId}
              </h1>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                isRunning
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : hasError
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {instance?.status || 'unknown'}
              </span>
            </div>
            <p className="text-zinc-500">
              <Link href={`/worlds/${worldId}`} className="hover:text-zinc-300">{worldId}</Link>
              {' / '}
              <Link href={`/worlds/${worldId}/environments/${envId}`} className="hover:text-zinc-300">{envId}</Link>
              {' / '}
              <Link href={`/worlds/${worldId}/environments/${envId}/projects/${projectId}`} className="hover:text-zinc-300">{projectId}</Link>
              {' / '}{agentId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={fetchAgent}>
              <RefreshCw className="w-5 h-5" />
            </Button>
            {isRunning ? (
              <Button variant="destructive" onClick={handleStop} disabled={stopping}>
                <Square className="w-4 h-4 mr-2" />
                {stopping ? 'Stopping...' : 'Stop'}
              </Button>
            ) : (
              <Button onClick={() => setShowTaskInput(true)}>
                <Play className="w-4 h-4 mr-2" />
                Spawn
              </Button>
            )}
          </div>
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
          <TabsTrigger value="content">AGENT.md</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
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
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Status</span>
                  <span className={`font-medium ${
                    isRunning ? 'text-green-400' : hasError ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {instance?.status || 'unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Session Key</span>
                  <code className="text-xs bg-zinc-800 px-2 py-1 rounded font-mono text-zinc-300 max-w-[200px] truncate">
                    {instance?.session_key || '-'}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Started At</span>
                  <span className="text-zinc-300">{formatTime(instance?.started_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Last Activity</span>
                  <span className="text-zinc-300">{formatTime(instance?.last_activity)}</span>
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
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Role</span>
                  <span className="text-zinc-300">{agent?.config?.metadata?.role || instance?.role || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Model</span>
                  <span className="text-zinc-300">{agent?.config?.metadata?.model || instance?.model || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Skills</span>
                  <div className="flex gap-1 flex-wrap justify-end">
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
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-medium">Agent Running</p>
                      <p className="text-sm text-zinc-400">Session: {instance.session_key}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Session Logs</CardTitle>
              <CardDescription>Agent session activity (coming soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Log viewer coming soon</p>
                <p className="text-zinc-600 text-sm mt-1">
                  Session key: {instance?.session_key || 'Not running'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Input Modal */}
      {showTaskInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Spawn Agent</CardTitle>
              <CardDescription>Agent'ı başlat ve görev ver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Task (optional)</label>
                  <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Agent'a ne yapmasını istiyorsun?"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="ghost" onClick={() => { setShowTaskInput(false); setTask(''); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSpawn} disabled={spawning}>
                    <Play className="w-4 h-4 mr-2" />
                    {spawning ? 'Spawning...' : 'Spawn'}
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
