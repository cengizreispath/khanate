'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, FolderKanban, Plus, ArrowLeft, Bot, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EntityEditor } from '@/components/EntityEditor';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MemoryBrowser } from '@/components/MemoryBrowser';

interface Project {
  id: string;
  name: string;
  status?: string;
  agentCount?: number;
}

interface EnvData {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  projects: Project[];
}

export default function EnvironmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;
  const envId = params.envId as string;
  
  const [env, setEnv] = useState<EnvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ id: '', name: '' });
  const [creating, setCreating] = useState(false);
  const [contentData, setContentData] = useState({ content: '', metadata: {} });

  useEffect(() => {
    fetchEnv();
    fetchContent();
  }, [worldId, envId]);

  const fetchEnv = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments/${envId}`);
      const data = await res.json();
      if (data.success) {
        setEnv(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch environment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments/${envId}/content`);
      const data = await res.json();
      if (data.success) {
        setContentData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
  };

  const saveContent = async (content: string) => {
    await fetch(`/api/worlds/${worldId}/environments/${envId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    fetchContent();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments/${envId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewProject({ id: '', name: '' });
        fetchEnv();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!env) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Environment not found</p>
        <Link href={`/worlds/${worldId}`} className="text-blue-400 hover:underline mt-2 inline-block">
          ← Back to World
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/worlds/${worldId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white capitalize">{env.name || envId}</h1>
            <p className="text-zinc-500">
              <Link href={`/worlds/${worldId}`} className="hover:text-zinc-300">{worldId}</Link>
              {' / '}{envId}
            </p>
          </div>
          <EntityEditor
            type="environment"
            id={envId}
            name={env.name || envId}
            description={env.description}
            metadata={env.metadata}
            onSave={async (data) => {
              await fetch(`/api/worlds/${worldId}/environments/${envId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              fetchEnv();
            }}
            onDelete={async () => {
              await fetch(`/api/worlds/${worldId}/environments/${envId}/update`, { method: 'DELETE' });
              router.push(`/worlds/${worldId}`);
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
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <FolderKanban className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-zinc-500 text-sm">Projects</p>
                    <p className="text-2xl font-bold">{env.projects?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <MarkdownEditor
            title="ENV.md"
            description="Environment documentation - shared context for all projects in this environment"
            content={contentData.content}
            onSave={saveContent}
          />
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory">
          <MemoryBrowser
            entityPath={`/api/worlds/${worldId}/environments/${envId}`}
            entityType="environment"
          />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Active projects in this environment</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={fetchEnv}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {env.projects && env.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {env.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/worlds/${worldId}/environments/${envId}/projects/${project.id}`}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-amber-500/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                          <FolderKanban className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white capitalize">{project.name || project.id}</p>
                          <p className="text-sm text-zinc-500">{project.id}</p>
                        </div>
                      </div>
                      {project.agentCount !== undefined && project.agentCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-green-400">
                          <Bot className="w-4 h-4" />
                          {project.agentCount}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FolderKanban className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">No projects yet</p>
                  <p className="text-zinc-600 text-sm mt-1">Create your first project to start spawning agents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Project</CardTitle>
              <CardDescription>Add a new project to this environment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">ID</label>
                  <input
                    type="text"
                    value={newProject.id}
                    onChange={(e) => setNewProject({ ...newProject, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="edenred"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Edenred Portal"
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create'}
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
