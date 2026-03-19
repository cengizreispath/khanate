'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWorld, setNewWorld] = useState({ id: '', name: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const res = await fetch('/api/worlds');
      const data = await res.json();
      if (data.success) {
        setWorlds(data.data.worlds || []);
      }
    } catch (error) {
      console.error('Failed to fetch worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorld),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewWorld({ id: '', name: '' });
        fetchWorlds();
      }
    } catch (error) {
      console.error('Failed to create world:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-zinc-500">Loading worlds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Worlds</h1>
          <p className="text-zinc-500">Top-level organizations and contexts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchWorlds}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create World
          </Button>
        </div>
      </div>

      {/* Worlds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {worlds.map((worldId) => (
          <Link
            key={worldId}
            href={`/worlds/${worldId}`}
            className="group"
          >
            <Card className="h-full hover:border-blue-500/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Globe className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-white capitalize">{worldId}</p>
                    <p className="text-sm text-zinc-500">Click to explore →</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {worlds.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No worlds created yet</p>
              <p className="text-zinc-600 text-sm mt-1">Create your first world to get started</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create World
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create World</CardTitle>
              <CardDescription>A world represents a top-level organization</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">ID</label>
                  <input
                    type="text"
                    value={newWorld.id}
                    onChange={(e) => setNewWorld({ ...newWorld, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="path"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Name</label>
                  <input
                    type="text"
                    value={newWorld.name}
                    onChange={(e) => setNewWorld({ ...newWorld, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="PATH Technology"
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
