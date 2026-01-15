
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  effort: number;
  remark?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  effort: string; // low, medium, high
  subtasks: SubTask[];
  remark?: string;
  createdAt: number;
}

export interface UserProfile {
  callsign: string;
  joinedAt: number;
}

export interface HoloSession {
  commandId: string;
  tasks: Task[];
  profile?: UserProfile;
}
