export type Task = {
  id: string;
  routine_id: string;
  name: string;
  duration: number;
  position: number;
};

export type Routine = {
  id: string;
  user_id: string;
  name: string;
  time_of_day: string | null;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type RoutineWithTasks = Routine & {
  tasks: Task[];
};
