import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { NotesList } from '../components/NotesList';
import { CreateNoteForm } from '../components/CreateNoteForm';
import { NoteDetail } from '../components/NoteDetail';
import { Note } from '../types/note';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Debug current user info
  console.log('🏠 Dashboard - Current user:', {
    user,
    isAuthenticated: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name
  });

  const handleLogout = () => {
    logout();
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setShowCreateForm(false);
  };

  const handleCreateNew = () => {
    setSelectedNote(null);
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // Force refresh of notes list by triggering a re-render
    window.location.reload();
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleNoteBack = () => {
    setSelectedNote(null);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setSelectedNote(updatedNote);
  };

  const handleNoteDelete = () => {
    setSelectedNote(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                Shared Todo App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {showCreateForm ? (
            <CreateNoteForm 
              onSuccess={handleCreateSuccess} 
              onCancel={handleCreateCancel}
            />
          ) : selectedNote ? (
            <NoteDetail 
              note={selectedNote}
              onBack={handleNoteBack}
              onUpdate={handleNoteUpdate}
              onDelete={handleNoteDelete}
            />
          ) : (
            <NotesList onNoteSelect={handleNoteSelect} onCreateNew={handleCreateNew} />
          )}
        </div>
      </main>
    </div>
  );
};