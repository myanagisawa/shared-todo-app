import React, { useState } from 'react';
import { Note, UpdateNoteData } from '../types/note';
import { noteApi } from '../services/noteApi';
import { useAuthStore } from '../stores/authStore';
import { InviteUserForm } from './InviteUserForm';
import { CollaboratorsList } from './CollaboratorsList';

interface NoteDetailProps {
  note: Note;
  onBack?: () => void;
  onUpdate?: (updatedNote: Note) => void;
  onDelete?: () => void;
}

export const NoteDetail: React.FC<NoteDetailProps> = ({ note, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [formData, setFormData] = useState<UpdateNoteData>({
    title: note.title,
    content: note.content,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const canEdit = note.authorId === user?.id || 
    note.noteUsers?.some(nu => nu.userId === user?.id && (nu.role === 'editor' || nu.role === 'admin'));
  
  const canDelete = note.authorId === user?.id;
  
  const canInvite = note.authorId === user?.id || 
    note.noteUsers?.some(nu => nu.userId === user?.id && nu.role === 'admin');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) {
      setError(null);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      title: note.title,
      content: note.content,
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.content?.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await noteApi.updateNote(note.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      if (response.success && response.data) {
        setIsEditing(false);
        onUpdate?.(response.data);
      } else {
        setError(response.error?.message || 'Failed to update note');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await noteApi.deleteNote(note.id);
      
      if (response.success) {
        onDelete?.();
      } else {
        setError(response.error?.message || 'Failed to delete note');
      }
    } catch (err) {
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="text-xl font-semibold text-gray-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  disabled={loading}
                />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900">{note.title}</h1>
              )}
              <div className="text-sm text-gray-500 mt-1">
                <span>By {note.author.name}</span>
                <span className="mx-2">•</span>
                <span>Created {formatDate(note.createdAt)}</span>
                {note.createdAt !== note.updatedAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Updated {formatDate(note.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading || !formData.title?.trim() || !formData.content?.trim()}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Edit
                  </button>
                )}
                {canInvite && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="px-3 py-1 text-sm text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100"
                    disabled={loading}
                  >
                    Invite
                  </button>
                )}
                <button
                  onClick={() => setShowCollaborators(!showCollaborators)}
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  {showCollaborators ? 'Hide' : 'Show'} Collaborators
                  {note.noteUsers && note.noteUsers.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full">
                      {note.noteUsers.length}
                    </span>
                  )}
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6">
        {isEditing ? (
          <textarea
            name="content"
            value={formData.content || ''}
            onChange={handleInputChange}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        ) : (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {note.content}
            </pre>
          </div>
        )}
      </div>

      {/* Invite User Form */}
      {showInviteForm && (
        <div className="px-6 py-4 border-t border-gray-200">
          <InviteUserForm 
            noteId={note.id}
            onSuccess={() => {
              setShowInviteForm(false);
              // Refresh note data could be implemented here
            }}
            onCancel={() => setShowInviteForm(false)}
          />
        </div>
      )}

      {/* Collaborators */}
      {showCollaborators && (
        <div className="px-6 py-4 border-t border-gray-200">
          <CollaboratorsList 
            note={note}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
};