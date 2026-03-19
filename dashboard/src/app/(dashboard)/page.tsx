'use client';

import { useEffect, useState } from 'react';
import { Globe, Bot, Zap, Activity, Play, Square, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
  role: string;
  project_id: string;
  status: string;
  started_at: string;
}

interface Status {
  worlds: number;
  running_agents: number;
  agents: Agent[];
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500">Overview of your agent orchestration system</p>
        </div>
        <Button onClick={fetchStatus} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Globe className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Worlds</p>
                <p className="text-4xl font-bold text-white">{status?.worlds || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Running Agents</p>
                <p className="text-4xl font-bold text-green-400">{status?.running_agents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <p className="text-zinc-500 text-sm">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xl font-bold text-green-400">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Agents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Running Agents</CardTitle>
            <CardDescription>Active agent instances across all projects</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchStatus}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {status?.agents && status.agents.length > 0 ? (
            <div className="space-y-3">
              {status.agents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{agent.name}</p>
                      <p className="text-sm text-zinc-500">
                        {agent.project_id} • {agent.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      agent.status === 'running' 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {agent.status}
                    </span>
                    <Button variant="destructive" size="sm">
                      <Square className="w-3 h-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No agents running</p>
              <p className="text-zinc-600 text-sm mt-1">Spawn an agent from the Worlds page</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/worlds">
                <Globe className="w-4 h-4 mr-2" />
                Manage Worlds
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="/agents">
                <Bot className="w-4 h-4 mr-2" />
                View All Agents
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/workflows">
                <Zap className="w-4 h-4 mr-2" />
                Workflows
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
