export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  noteId: string;
  authorId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  note: {
    id: string;
    title: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  assigneeId?: string;
}

export interface TasksListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  authorId?: string;
  noteId?: string;
}