'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Save, Eye, Edit3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Dynamic import to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MarkdownEditorProps {
  title: string;
  description?: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  readOnly?: boolean;
}

export function MarkdownEditor({ title, description, content, onSave, readOnly = false }: MarkdownEditorProps) {
  const [value, setValue] = useState(content);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (val?: string) => {
    setValue(val || '');
    setHasChanges(val !== content);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <>
              <Button
                variant={mode === 'preview' ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => setMode('preview')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                variant={mode === 'edit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMode('edit')}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              {hasChanges && (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div data-color-mode="dark" className="wmde-markdown-var">
          <MDEditor
            value={value}
            onChange={handleChange}
            preview={mode === 'preview' ? 'preview' : 'edit'}
            hideToolbar={mode === 'preview'}
            height={400}
            style={{ backgroundColor: '#18181b' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
