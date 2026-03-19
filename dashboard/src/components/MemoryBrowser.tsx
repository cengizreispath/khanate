'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MarkdownEditor } from './MarkdownEditor';

interface MemoryFile {
  name: string;
  date: string;
  size?: number;
}

interface MemoryBrowserProps {
  entityPath: string; // e.g., /api/worlds/path/content
  entityType: 'world' | 'environment' | 'project' | 'agent';
}

export function MemoryBrowser({ entityPath, entityType }: MemoryBrowserProps) {
  const [memories, setMemories] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    fetchMemories();
  }, [entityPath]);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${entityPath}/memories`);
      const data = await res.json();
      if (data.success) {
        setMemories(data.data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filename: string) => {
    try {
      const res = await fetch(`${entityPath}/memories/${filename}`);
      const data = await res.json();
      if (data.success) {
        setFileContent(data.data.content);
        setSelectedFile(filename);
      }
    } catch (error) {
      console.error('Failed to fetch file:', error);
    }
  };

  const saveFileContent = async (content: string) => {
    if (!selectedFile) return;
    try {
      await fetch(`${entityPath}/memories/${selectedFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const addMemoryEntry = async () => {
    if (!newEntry.trim()) return;
    try {
      await fetch(`${entityPath}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newEntry }),
      });
      setNewEntry('');
      setShowNewEntry(false);
      fetchMemories();
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* File List */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Memory Files
            </CardTitle>
            <CardDescription>Daily notes and logs</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowNewEntry(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-zinc-500">Loading...</div>
          ) : memories.length > 0 ? (
            <div className="space-y-1">
              {memories.map((file) => (
                <button
                  key={file.name}
                  onClick={() => fetchFileContent(file.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedFile === file.name
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1 text-sm">{file.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No memory files yet</p>
            </div>
          )}

          {/* New Entry Form */}
          {showNewEntry && (
            <div className="mt-4 p-3 border border-zinc-700 rounded-lg space-y-2">
              <textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="Add a memory note..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowNewEntry(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={addMemoryEntry}>
                  Add Entry
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Content */}
      <div className="lg:col-span-2">
        {selectedFile ? (
          <MarkdownEditor
            title={selectedFile}
            description="Memory file content"
            content={fileContent}
            onSave={saveFileContent}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Select a memory file to view</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
