export interface Note {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  noteUsers?: NoteUser[];
}

export interface NoteUser {
  id: string;
  noteId: string;
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateNoteData {
  title: string;
  content: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface NotesListResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface InviteUserData {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
}