'use client';

import { useState } from 'react';
import { Pencil, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface EntityEditorProps {
  type: 'world' | 'environment' | 'project';
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  onSave: (data: { name: string; description: string; metadata: Record<string, string> }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const metadataFields: Record<string, { label: string; placeholder: string }[]> = {
  world: [
    { label: 'Organization Type', placeholder: 'e.g., Software Company' },
    { label: 'Location', placeholder: 'e.g., Turkey' },
    { label: 'Culture Notes', placeholder: 'Team culture, values...' },
  ],
  environment: [
    { label: 'Team Size', placeholder: 'e.g., 15 people' },
    { label: 'Focus Area', placeholder: 'e.g., E-commerce, Web Development' },
    { label: 'Tools', placeholder: 'e.g., ClickUp, GitHub, Slack' },
  ],
  project: [
    { label: 'Client', placeholder: 'e.g., Edenred' },
    { label: 'Tech Stack', placeholder: 'e.g., Next.js, Drupal, PostgreSQL' },
    { label: 'Status', placeholder: 'e.g., Active, Maintenance' },
    { label: 'Contact', placeholder: 'e.g., john@client.com' },
  ],
};

export function EntityEditor({ type, id, name, description, metadata, onSave, onDelete }: EntityEditorProps) {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: name || '',
    description: description || '',
    metadata: metadata || {},
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      setDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleting(false);
    }
  };

  const fields = metadataFields[type] || [];

  return (
    <>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Pencil className="w-4 h-4" />
        </Button>
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
            <DialogDescription>Update details for {id}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder={`Describe this ${type}...`}
              />
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Additional Info</h4>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs text-zinc-500">{field.label}</label>
                    <input
                      type="text"
                      value={formData.metadata[field.label.toLowerCase().replace(/\s+/g, '_')] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          [field.label.toLowerCase().replace(/\s+/g, '_')]: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete {type}?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{name}" and all its contents. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
