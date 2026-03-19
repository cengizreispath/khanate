'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, Building2, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Environment {
  id: string;
  name: string;
  projectCount?: number;
}

interface WorldData {
  id: string;
  name: string;
  environments: Environment[];
}

export default function WorldDetailPage() {
  const params = useParams();
  const worldId = params.worldId as string;
  
  const [world, setWorld] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEnv, setNewEnv] = useState({ id: '', name: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorld();
  }, [worldId]);

  const fetchWorld = async () => {
    try {
      const res = await fetch(`/api/worlds/${worldId}`);
      const data = await res.json();
      if (data.success) {
        setWorld(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch world:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/worlds/${worldId}/environments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnv),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewEnv({ id: '', name: '' });
        fetchWorld();
      }
    } catch (error) {
      console.error('Failed to create environment:', error);
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

  if (!world) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">World not found</p>
        <Link href="/worlds" className="text-blue-400 hover:underline mt-2 inline-block">
          ← Back to Worlds
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/worlds">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Globe className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{world.name || worldId}</h1>
            <p className="text-zinc-500">World ID: {worldId}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Building2 className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-zinc-500 text-sm">Environments</p>
                <p className="text-2xl font-bold">{world.environments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Environments</CardTitle>
            <CardDescription>Departments and teams within this world</CardDescription>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Environment
          </Button>
        </CardHeader>
        <CardContent>
          {world.environments && world.environments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {world.environments.map((env) => (
                <Link
                  key={env.id}
                  href={`/worlds/${worldId}/environments/${env.id}`}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-purple-500/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">{env.name || env.id}</p>
                      <p className="text-sm text-zinc-500">{env.id}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No environments yet</p>
              <p className="text-zinc-600 text-sm mt-1">Create your first environment to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Environment</CardTitle>
              <CardDescription>Add a new department or team</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">ID</label>
                  <input
                    type="text"
                    value={newEnv.id}
                    onChange={(e) => setNewEnv({ ...newEnv, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="project-division"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Name</label>
                  <input
                    type="text"
                    value={newEnv.name}
                    onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Project Division"
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
