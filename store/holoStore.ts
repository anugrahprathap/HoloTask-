
import { Task, HoloSession } from '../types';

const KEY_PREFIX = 'HOLOTASK_V2_';

export const saveSession = (commandId: string, tasks: Task[]) => {
  localStorage.setItem(`${KEY_PREFIX}${commandId}`, JSON.stringify(tasks));
};

export const getSession = (commandId: string): Task[] => {
  const data = localStorage.getItem(`${KEY_PREFIX}${commandId}`);
  return data ? JSON.parse(data) : [];
};

export const clearSession = (commandId: string) => {
  // We keep the data but clear the active uplink state in App
};
