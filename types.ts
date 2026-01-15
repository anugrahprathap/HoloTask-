
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  effort: number;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  effort: string; // low, medium, high
  subtasks: SubTask[];
  createdAt: number;
}

export interface HoloSession {
  commandId: string;
  tasks: Task[];
}
