'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Play, Square, RefreshCw, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Agent {
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    // Poll for updates
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  // Active states for "Running Agents" section = only busy (actively working)
  const isBusyStatus = (status: string) => status === 'busy';
  // Alive agents = busy or idle (have active session)
  const isAliveStatus = (status: string) => ['busy', 'idle'].includes(status);
  const runningAgents = agents.filter(a => isBusyStatus(a.status));
  const stoppedAgents = agents.filter(a => !isAliveStatus(a.status));
  
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'busy': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'idle': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAgentKey = (agent: Agent) => 
    `${agent.world_id}/${agent.env_id}/${agent.project_id}/${agent.agent_id}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-zinc-500">Tüm agent'ları görüntüle ve yönet</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchAgents}>
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Running</p>
                <p className="text-2xl font-bold text-green-400">{runningAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center">
                <Square className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Stopped</p>
                <p className="text-2xl font-bold text-zinc-400">{stoppedAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Agents */}
      {runningAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Running Agents
            </CardTitle>
            <CardDescription>Aktif çalışan agent'lar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runningAgents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${encodeURIComponent(getAgentKey(agent))}`}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      agent.status === 'busy' 
                        ? 'bg-orange-500/10 border border-orange-500/20'
                        : agent.status === 'idle'
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-green-500/10 border border-green-500/20'
                    }`}>
                      <Bot className={`w-5 h-5 ${
                        agent.status === 'busy' ? 'text-orange-400' 
                        : agent.status === 'idle' ? 'text-blue-400' 
                        : 'text-green-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{agent.name || agent.agent_id}</p>
                      <p className="text-sm text-zinc-500">
                        {agent.world_id} / {agent.env_id} / {agent.project_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Started</p>
                      <p className="text-sm text-zinc-400">{formatTime(agent.started_at)}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Agents */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>Kayıtlı tüm agent'lar</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length > 0 ? (
            <div className="space-y-3">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${encodeURIComponent(getAgentKey(agent))}`}
                  className="block p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
                      isAliveStatus(agent.status)
                        ? agent.status === 'busy' 
                          ? 'bg-orange-500/10 border border-orange-500/20'
                          : agent.status === 'idle'
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'bg-green-500/10 border border-green-500/20'
                        : 'bg-zinc-800 border border-zinc-700'
                    }`}>
                      <Bot className={`w-5 h-5 ${
                        isAliveStatus(agent.status)
                          ? agent.status === 'busy' ? 'text-orange-400' 
                            : agent.status === 'idle' ? 'text-blue-400' 
                            : 'text-green-400'
                          : 'text-zinc-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white truncate">{agent.name || agent.agent_id}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {agent.role} • {agent.model.split('/').pop()}
                      </p>
                      <p className="text-xs text-zinc-600 truncate mt-0.5">
                        {agent.project_id} @ {agent.world_id}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Henüz agent yok</p>
              <p className="text-zinc-600 text-sm mt-1">Bir projede agent spawn ederek başla</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
