import React, { useState } from 'react';
import { Note } from '../types/note';
import { noteApi } from '../services/noteApi';
import { useAuthStore } from '../stores/authStore';

interface CollaboratorsListProps {
  note: Note;
  onUpdate?: (updatedNote: Note) => void;
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ note, onUpdate }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const canManageUsers = note.authorId === user?.id || 
    note.noteUsers?.some(nu => nu.userId === user?.id && nu.role === 'admin');

  console.log('👥 CollaboratorsList - Rendered:', {
    noteId: note.id,
    noteTitle: note.title,
    currentUser: user?.id,
    canManageUsers,
    collaborators: note.noteUsers,
    noteAuthor: note.authorId
  });

  const handleRoleChange = async (userId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    try {
      setLoading(userId);
      setError(null);
      
      const response = await noteApi.updateUserRole(note.id, userId, newRole);
      
      if (response.success) {
        // Update note users list locally
        const updatedNoteUsers = note.noteUsers?.map(nu => 
          nu.userId === userId ? { ...nu, role: newRole } : nu
        );
        const updatedNote = { ...note, noteUsers: updatedNoteUsers };
        onUpdate?.(updatedNote);
      } else {
        setError(response.error?.message || 'Failed to update user role');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const noteUser = note.noteUsers?.find(nu => nu.userId === userId);
    if (!noteUser) return;

    if (!confirm(`Are you sure you want to remove ${noteUser.user.name} from this note?`)) {
      return;
    }

    try {
      setLoading(userId);
      setError(null);
      
      const response = await noteApi.removeUser(note.id, userId);
      
      if (response.success) {
        // Remove user from note users list locally
        const updatedNoteUsers = note.noteUsers?.filter(nu => nu.userId !== userId);
        const updatedNote = { ...note, noteUsers: updatedNoteUsers };
        onUpdate?.(updatedNote);
      } else {
        setError(response.error?.message || 'Failed to remove user');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Collaborators</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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

      {/* Author */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {note.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{note.author.name}</p>
              <p className="text-sm text-gray-500">{note.author.email}</p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Owner
          </span>
        </div>
      </div>

      {/* Collaborators */}
      {note.noteUsers && note.noteUsers.length > 0 ? (
        <div className="space-y-3">
          {note.noteUsers.map((noteUser) => (
            <div key={noteUser.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {noteUser.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{noteUser.user.name}</p>
                    <p className="text-sm text-gray-500">{noteUser.user.email}</p>
                    <p className="text-xs text-gray-400">Joined {formatDate(noteUser.joinedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {canManageUsers ? (
                    <select
                      value={noteUser.role}
                      onChange={(e) => handleRoleChange(noteUser.userId, e.target.value as 'viewer' | 'editor' | 'admin')}
                      disabled={loading === noteUser.userId}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(noteUser.role)}`}>
                      {noteUser.role}
                    </span>
                  )}
                  
                  {canManageUsers && (
                    <button
                      onClick={() => handleRemoveUser(noteUser.userId)}
                      disabled={loading === noteUser.userId}
                      className="text-red-400 hover:text-red-600 disabled:opacity-50"
                      title="Remove user"
                    >
                      {loading === noteUser.userId ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-2 text-sm">No collaborators yet</p>
          <p className="text-xs text-gray-400">Invite users to collaborate on this note</p>
        </div>
      )}
    </div>
  );
};