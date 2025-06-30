import React, { useState, useEffect } from 'react';
import { Note } from '../types/note';
import { noteApi } from '../services/noteApi';
import { useAuthStore } from '../stores/authStore';

interface NotesListProps {
  onNoteSelect?: (note: Note) => void;
  onCreateNew?: () => void;
}

export const NotesList: React.FC<NotesListProps> = ({ onNoteSelect, onCreateNew }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuthStore();

  const loadNotes = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await noteApi.getNotes(pageNum, 10);
      
      if (response.success && response.data) {
        console.log('📋 NotesList - Loaded notes:', {
          currentUser: user,
          notesCount: response.data.notes.length,
          notes: response.data.notes.map(note => ({
            id: note.id,
            title: note.title,
            authorId: note.authorId,
            isAuthor: note.authorId === user?.id,
            collaborators: note.noteUsers,
            userRole: note.noteUsers?.find(nu => nu.userId === user?.id)?.role || 'none'
          }))
        });
        setNotes(response.data.notes);
        setTotalPages(response.data.pagination.totalPages);
        setPage(pageNum);
      } else {
        setError(response.error?.message || 'Failed to load notes');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await noteApi.deleteNote(noteId);
      if (response.success) {
        await loadNotes(page);
      } else {
        setError(response.error?.message || 'Failed to delete note');
      }
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canDeleteNote = (note: Note) => {
    return note.authorId === user?.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading notes</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => loadNotes(page)}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
        <button
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Create New Note
        </button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notes</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new note.</p>
          <div className="mt-6">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Note
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {notes.map((note) => (
              <li
                key={note.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onNoteSelect?.(note)}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {note.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>By {note.author.name}</span>
                        <span>•</span>
                        <span>Created {formatDate(note.createdAt)}</span>
                        {note.createdAt !== note.updatedAt && (
                          <>
                            <span>•</span>
                            <span>Updated {formatDate(note.updatedAt)}</span>
                          </>
                        )}
                        {note.noteUsers && note.noteUsers.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{note.noteUsers.length} collaborator{note.noteUsers.length === 1 ? '' : 's'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canDeleteNote(note) && (
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete note"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => loadNotes(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => loadNotes(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};