'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Bot, Plus, ArrowLeft, Play, Square, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EntityEditor } from '@/components/EntityEditor';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MemoryBrowser } from '@/components/MemoryBrowser';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  started_at?: string;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  content?: string;
  metadata?: Record<string, string>;
  agents: Agent[];
  availableTemplates: string[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;
  const envId = params.envId as string;
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSpawn, setShowSpawn] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [task, setTask] = useState('');
  const [spawning, setSpawning] = useState(false);
  const [spawnError, setSpawnError] = useState('');
  const [contentData, setContentData] = useState({ content: '', metadata: {} });

  useEffect(() => {
    fetchProject();
    fetchContent();
  }, [worldId, envId, projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}/content`);
      const data = await res.json();
      if (data.success) {
        setContentData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
  };

  const saveContent = async (content: string) => {
    await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    fetchContent();
  };

  const handleSpawn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpawning(true);
    setSpawnError('');
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate, task }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSpawn(false);
        setSelectedTemplate('');
        setTask('');
        fetchProject();
      } else {
        setSpawnError(data.error || 'Failed to spawn agent');
      }
    } catch (error) {
      setSpawnError('Network error');
    } finally {
      setSpawning(false);
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}/agents/${agentId}`, {
        method: 'DELETE',
      });
      fetchProject();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Project not found</p>
        <Link href={`/worlds/${worldId}/environments/${envId}`} className="text-blue-400 hover:underline mt-2 inline-block">
          ← Back to Environment
        </Link>
      </div>
    );
  }

  const runningAgents = project.agents?.filter(a => a.status === 'running') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/worlds/${worldId}/environments/${envId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
            <FolderKanban className="w-7 h-7 text-amber-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white capitalize">{project.name || projectId}</h1>
            <p className="text-zinc-500">
              <Link href={`/worlds/${worldId}`} className="hover:text-zinc-300">{worldId}</Link>
              {' / '}
              <Link href={`/worlds/${worldId}/environments/${envId}`} className="hover:text-zinc-300">{envId}</Link>
              {' / '}{projectId}
            </p>
          </div>
          <EntityEditor
            type="project"
            id={projectId}
            name={project.name || projectId}
            description={project.description}
            metadata={project.metadata}
            onSave={async (data) => {
              await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              fetchProject();
            }}
            onDelete={async () => {
              await fetch(`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}/update`, {
                method: 'DELETE',
              });
              router.push(`/worlds/${worldId}/environments/${envId}`);
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Bot className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-zinc-500 text-sm">Running Agents</p>
                    <p className="text-2xl font-bold text-green-400">{runningAgents.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <FolderKanban className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-zinc-500 text-sm">Total Agents</p>
                    <p className="text-2xl font-bold">{project.agents?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={() => setShowSpawn(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Spawn Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <MarkdownEditor
            title="PROJECT.md"
            description="Project documentation and context for agents"
            content={contentData.content}
            onSave={saveContent}
          />
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory">
          <MemoryBrowser
            entityPath={`/api/worlds/${worldId}/environments/${envId}/projects/${projectId}`}
            entityType="project"
          />
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agents</CardTitle>
                <CardDescription>AI agents working on this project</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={fetchProject}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button onClick={() => setShowSpawn(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Spawn Agent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.agents && project.agents.length > 0 ? (
                <div className="space-y-3">
                  {project.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                    >
                      <Link 
                        href={`/agents/${encodeURIComponent(`${worldId}/${envId}/${projectId}/${agent.id}`)}`}
                        className="flex items-center gap-4 flex-1"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          agent.status === 'running' 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : 'bg-zinc-800 border border-zinc-700'
                        }`}>
                          <Bot className={`w-5 h-5 ${agent.status === 'running' ? 'text-green-400' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{agent.name || agent.id}</p>
                          <p className="text-sm text-zinc-500">{agent.role}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          agent.status === 'running'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {agent.status}
                        </span>
                        {agent.status === 'running' && (
                          <Button variant="destructive" size="sm" onClick={(e) => { e.preventDefault(); handleStopAgent(agent.id); }}>
                            <Square className="w-3 h-3 mr-1" />
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">No agents yet</p>
                  <p className="text-zinc-600 text-sm mt-1">Spawn an agent to start working on this project</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Spawn Modal */}
      {showSpawn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Spawn Agent</CardTitle>
              <CardDescription>Start a new AI agent for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSpawn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Agent Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select a template...</option>
                    {(project.availableTemplates || ['developer', 'qa', 'orchestrator']).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Task (optional)</label>
                  <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Describe the task for this agent..."
                    rows={3}
                  />
                </div>
                {spawnError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {spawnError}
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="ghost" onClick={() => { setShowSpawn(false); setSpawnError(''); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={spawning || !selectedTemplate}>
                    <Play className="w-4 h-4 mr-2" />
                    {spawning ? 'Spawning...' : 'Spawn'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
