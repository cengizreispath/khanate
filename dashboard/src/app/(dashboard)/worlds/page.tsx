'use client';

import { useEffect, useState } from 'react';

interface World {
  id: string;
}

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWorld, setNewWorld] = useState({ id: '', name: '' });

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      const res = await fetch('/api/worlds');
      const data = await res.json();
      if (data.success) {
        setWorlds(data.data.worlds);
      }
    } catch (error) {
      console.error('Failed to fetch worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Worlds</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          + Create World
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create World</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID</label>
                <input
                  type="text"
                  value={newWorld.id}
                  onChange={(e) => setNewWorld({ ...newWorld, id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="my-world"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newWorld.name}
                  onChange={(e) => setNewWorld({ ...newWorld, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="My World"
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worlds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {worlds.map((worldId) => (
          <a
            key={worldId}
            href={`/worlds/${worldId}`}
            className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-2xl group-hover:bg-blue-600/30 transition-colors">
                🌍
              </div>
              <div>
                <p className="font-semibold text-lg capitalize">{worldId}</p>
                <p className="text-sm text-gray-400">Click to explore</p>
              </div>
            </div>
          </a>
        ))}

        {worlds.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No worlds created yet. Create your first world!
          </div>
        )}
      </div>
    </div>
  );
}
