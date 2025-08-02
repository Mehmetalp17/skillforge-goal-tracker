export enum GoalStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Completed = 'Completed',
  OnHold = 'On Hold',
  Cancelled = 'Cancelled',
}

export enum GoalDifficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Expert = 'Expert',
}

export interface LearningGoal {
  _id: string;
  title: string;
  description: string;
  owner: string; // User ID
  startDate: string; // ISO string
  targetEndDate: string; // ISO string
  status: GoalStatus;
  progressPercentage: number;
  difficulty: GoalDifficulty;
  parentGoal: string | null;
  notes?: string;
  isArchived: boolean;
  createdAt: string; // ISO string
}

export interface SuggestedGoal {
  title: string;
  description: string;
  difficulty: GoalDifficulty;
  durationDays: number;
  suggestedStartDate?: string; // ISO date string
  suggestedEndDate?: string;   // ISO date string
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
